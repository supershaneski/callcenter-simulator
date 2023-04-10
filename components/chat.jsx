'use client'

import React from 'react'
import { createPortal } from 'react-dom'
//import PropTypes from 'prop-types'

import { useRouter } from 'next/navigation'

import Typography from '@mui/material/Typography'
import IconButton from '@mui/material/IconButton'
import Button from '@mui/material/Button'

import Box from '@mui/material/Box'
import TextField from '@mui/material/TextField'
import InputAdornment from '@mui/material/InputAdornment'

import ClearIcon from '@mui/icons-material/Clear'
import SendIcon from '@mui/icons-material/Send'

import ContentItem from './contentitem'
import LoadingText from './loadingtext'

import captions from '../assets/chat.json'
import useCaption from '../lib/usecaption'

import sessions from '../lib/session'
import useAppStore from '../stores/appstore'
import useFileStore from '../stores/filestore'

import { getSimpleId, formatMessage } from '../lib/utils'

import Loader from './loader'

import EndSession from './endsession'

import CustomTheme from './customtheme'

import classes from './chat.module.css'

export default function Chat() {

    const router = useRouter()

    const setCaption = useCaption(captions)

    const setMode = useAppStore((state) => state.setMode)
    const inquiryType = useAppStore((state) => state.inquiryType)
    const files = useFileStore((state) => state.files)

    const timerRef = React.useRef()
    const messageRef = React.useRef()
    const inputRef = React.useRef()

    const [messageItems, setMessageItems] = React.useState([])
    const [inputText, setInputText] = React.useState('')
    const [loading, setLoading] = React.useState(false)

    const [openLoader, setOpenLoader] = React.useState(false)

    const [isMounted, setMounted] = React.useState(false)
    const [isSessionEnded, setSessionEnd] = React.useState(false)

    React.useEffect(() => {

        const handleModeChange = (e) => {
            
            setMode(e.matches)

        }

        window.matchMedia('(prefers-color-scheme: dark)').addEventListener('change', handleModeChange)
        
        setMode(window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches)
        
        setMounted(true)

        return () => {

            try {

                window.matchMedia('(prefers-color-scheme: dark)').removeEventListener('change', handleModeChange)

            } catch(err) {
                //
            }
            
        }

    }, [])

    React.useEffect(() => {

        if(isMounted) {

            welcomeGreeting()

        }

    }, [isMounted])

    /*
    React.useEffect(() => {

        if(openLoader) {
            
            getEvaluation()

        }

    }, [openLoader])
    */

    const welcomeGreeting = React.useCallback(() => {
        
        const index = Math.round(10 * Math.random()) > 5 ? 2 : 1

        const key = inquiryType === 2 ? 'product' : inquiryType === 1 ? 'order' : 'other'

        const greetings = setCaption(`greeting-${key}-${index}`)

        setMessageItems([
            { 
                id: getSimpleId(),
                type: 'assistant',
                datetime: Date.now(),
                contents: `Response: ${greetings}`,
            }
        ])

    }, [ inquiryType, setCaption ])

    const getEvaluation = React.useCallback(async (rate) => {
        
        if(messageItems.length < 2) {
            
            router.push('/')
            
            return

        }
        
        const content_items = messageItems.map((item) => {

            const author = item.type !== 'user' ? 'support-agent' : 'customer'

            let str = item.contents

            if(item.type !== 'user') {

                str = formatMessage(item.contents)

                /*
                const tokens = item.contents.split('\n')

                for(let i = 0; i < tokens.length; i++) {

                    if(tokens[i].indexOf('Customer-Sentiment:') < 0 || tokens[i].indexOf('Command-Line:') < 0) {

                        str += tokens[i].replace('Response:', '')

                    }

                }

                str = str.replace('SESSION-ENDED', '')
                */

            }

            return `${author}: ${str}`
        })
        
        const contents = content_items.join('\n')

        //console.log('summary', contents)

        let result = await new Promise(async (resolve, reject) => {

            /*
            const question = `this ends the simulation. can you evaluate the overall session and give analysis.`
                //`Simulation has ended.` +
                //`Please evaluate the overall session, give final sentiment analysis and make suggestion if necessary.`
            */
            
            const response = await fetch('/summary/', {
                method: 'POST',
                headers: {
                  'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                  contents,
                  rating: rate,
                  language: navigator.language.toUpperCase().indexOf('EN') >= 0 ? 0 : 1
                }),
            })

            if(!response.ok) {
                resolve({
                    output: ''
                })
            }

            const retval = await response.json()

            resolve({
                output: retval.text
            })

        })

        const sid = getSimpleId()

        const session = {
            id: sid,
            datetime: Date.now(),
            inquiry: inquiryType,
            mode: 0,
            rate,
            items: messageItems,
            sentiment: result.output,
            summary: result.output,
        }

        await sessions.createSessionAsync(sid, session)

        router.push('/')

    }, [messageItems])
    
    const handleSubmit = async () => {
        
        const previous = messageItems.map((item) => {
            return {
                role: item.type !== 'user' ? 'assistant' : 'user',
                content: item.contents,
            }
        })

        const user_message = {
            id: getSimpleId(),
            type: 'user',
            contents: inputText,
            datetime: Date.now(),
        }

        setInputText('')

        setMessageItems((prevItems) => [...prevItems, ...[user_message]])

        setLoading(true)

        scrollToTop()

        try {

            const formData = JSON.stringify({
                files: files,
                question: inputText,
                maxResults: 10,
            })
            
            const res = await fetch('/embeddings/', {
                method: 'POST',
                headers: {
                    'Accept': 'application/json',
                },
                body: formData,
            })


            if(!res.ok) {
                console.log('Oops, an error occurred.', res.status)
            }

            const result = await res.json()

            const results = result.searchResults
            
            const response = await fetch('/chat/', {
                method: 'POST',
                headers: {
                  'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                  question: inputText,
                  previous,
                  inquiry: inquiryType,
                  fileChunks: results,
                }),
            })

            if(!response.ok) {
                console.log('Oops, an error occurred!', response.status)
            }

            const retval = await response.json()

            const resp = retval.text
            if(resp.indexOf('SESSION-ENDED') >= 0) {
                setSessionEnd(true)
            }

            const system_message = {
                id: getSimpleId(),
                type: 'system',
                contents: retval.text,
                datetime: Date.now(),
            }
    
            setMessageItems((prevItems) => [...prevItems, ...[system_message]])
            
            setLoading(false)

            scrollToTop()

            setTimeout(() => {
                inputRef.current.focus()
            }, 200)

        } catch(err) {

            console.log(err)

            const system_message = {
                id: getSimpleId(),
                type: 'system',
                contents: setCaption('error-message'), //'Oops, an error occurred',
                datetime: Date.now(),
            }
    
            setMessageItems((prevItems) => [...prevItems, ...[system_message]])
            
            setLoading(false)

            scrollToTop()
        }

    }

    const scrollToTop = () => {

        clearTimeout(timerRef.current)

        timerRef.current = setTimeout(() => {

            console.log("scroll")
            messageRef.current.scrollTop = messageRef.current.scrollHeight

        }, 100)
    }

    const handleExit = () => {

        if(messageItems.length < 2) {
            
            router.push('/')
            
            return

        }
        
        setOpenLoader(true)
        
    }

    const handleCloseLoader = (rate) => {
        
        getEvaluation(rate)

    }

    const setInquiryCaption = () => {
        const key = inquiryType === 1 ? 'order-inquiry' : inquiryType === 2 ? 'product-inquiry' : 'others'
        return setCaption(key)
    }

    /*const handleKeyDown = (e) => {
        if(e.keyCode === 13) {
            
            e.preventDefault()
            e.stopPropagation()

            try {
                document.activeElement.blur()
            } catch(err) {
                console.log(err)
            }

            handleSubmit()

        }
    }*/

    return (
        <div className={classes.container}>
            <div className={classes.header}>
                <div className={classes.banner}>
                    <span className={classes.bannerTitle}>{ setInquiryCaption() }</span>
                </div>
                <CustomTheme>
                    <IconButton onClick={handleExit} sx={{mr: 1}}>
                        <ClearIcon />
                    </IconButton>
                </CustomTheme>
            </div>
            <div ref={messageRef} className={classes.main}>
                <div className={classes.contents}>
                    {
                        messageItems.length > 0 &&
                        messageItems.map((item) => {
                            
                            let text = item.contents //.replace('SESSION-ENDED', '')

                            if(item.type !== 'user') {
                                //let tokens = text.split('\n')
                                //if(tokens[0].indexOf('Customer-Sentiment:') >= 0) text = tokens.slice(1)
                                text = formatMessage(item.contents)
                            }

                            return (
                                <div key={item.id} className={classes.contentItem}>
                                    <ContentItem role={item.type} content={text} />
                                </div>
                            )
                        })
                    }
                    {
                        isSessionEnded &&
                        <div className={classes.contentItem} style={{display: 'flex', justifyContent: 'center'}}>
                            <EndSession onClick={handleExit} />
                        </div>
                    }
                    {
                        loading &&
                        <div className={classes.contentItem}>
                            <LoadingText />
                        </div>
                    }
                </div>
            </div>
            <div className={classes.input}>
                <div className={classes.inputText}>
                    <CustomTheme>
                        <Box 
                        component="form" 
                        //onSubmit={handleSubmit} 
                        noValidate>
                            <TextField 
                            //disabled={loading || isSessionEnded}
                            disabled={loading}
                            fullWidth
                            multiline
                            maxRows={6}
                            inputRef={inputRef}
                            value={inputText}
                            placeholder={setCaption('write-message')}
                            //onKeyDown={handleKeyDown}
                            onChange={(e) => setInputText(e.target.value)}
                            InputProps={{
                                endAdornment: (
                                    <InputAdornment position="end">
                                        <>
                                        <IconButton
                                        //disabled={inputText.length === 0 || isSessionEnded}
                                        disabled={inputText.length === 0}
                                        onClick={() => setInputText('')}
                                        >
                                            <ClearIcon />
                                        </IconButton>
                                        <IconButton
                                        //disabled={inputText.length === 0 || isSessionEnded}
                                        disabled={inputText.length === 0}
                                        onClick={handleSubmit}
                                        >
                                            <SendIcon />
                                        </IconButton>
                                        </>
                                    </InputAdornment>
                                ),
                            }}
                            />
                        </Box>
                    </CustomTheme>
                </div>
            </div>
            {
                openLoader && createPortal(
                    <Loader onClick={handleCloseLoader} />,
                    document.body,
                )
            }
        </div>
    )
}