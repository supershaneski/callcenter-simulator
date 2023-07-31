'use client'

import React from 'react'
import { createPortal } from 'react-dom'

import { useRouter } from 'next/navigation'

import IconButton from '@mui/material/IconButton'
import Box from '@mui/material/Box'
import TextField from '@mui/material/TextField'
import InputAdornment from '@mui/material/InputAdornment'
import ClearIcon from '@mui/icons-material/Clear'
import SendIcon from '@mui/icons-material/Send'

import ContentItem from './contentitem'
import LoadingText from './loadingtext'
import captions from '../assets/chat.json'
import useCaption from '../lib/usecaption'

import useAppStore from '../stores/appstore'

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

    const timerRef = React.useRef()
    const messageRef = React.useRef()
    const inputRef = React.useRef()

    const [messageItems, setMessageItems] = React.useState([])
    const [inputText, setInputText] = React.useState('')
    const [loading, setLoading] = React.useState(false)

    const [openLoader, setOpenLoader] = React.useState(false)
    const [isMounted, setMounted] = React.useState(false)
    const [isSessionEnded, setSessionEnd] = React.useState(false)

    const [files, setFiles] = React.useState([])

    const [orderId, setOrderId] = React.useState('')
    const [orderData, setOrderData] = React.useState('')
    const [fileData, setFileData] = React.useState('')

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

            getFiles()

            welcomeGreeting()

        }

    }, [isMounted])
    
    const getFiles = React.useCallback(async () => {

        try {

            const response = await fetch('/files/', {
                method: 'GET',
                headers: {
                    'Content-Type': 'application/json',
                }
            })

            if(!response.ok) {
                console.log('Oops, an error occurred', response.status)
            }

            const { items } = await response.json()

            setFiles(items)

        } catch(error) {
            console.log(error)
        }

    }, [])

    const welcomeGreeting = React.useCallback(() => {
        
        //const index = Math.round(10 * Math.random()) > 5 ? 2 : 1
        //const key = inquiryType === 2 ? 'product' : inquiryType === 1 ? 'order' : 'other'
        //const greetings = setCaption(`greeting-${key}-${index}`)

        const greetings = setCaption('greeting-chat')

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

            }

            return `${author}: ${str}`
        })
        
        const contents = content_items.join('\n')

        let result = await new Promise(async (resolve, reject) => {

            try {

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
                        output: '',
                        inquiry_type: 0
                    })
                }
    
                const retval = await response.json()
    
                console.log('summary-inquiry-type', retval.inquiry_type)
    
                resolve({
                    output: retval.text,
                    inquiry_type: retval.inquiry_type
                })

            } catch(err) {
                
                console.log('summary-error', err)

                resolve({
                    output: '',
                    inquiry_type: 0,
                })

            }

        })

        console.log("promise result", result, (new Date()).toLocaleTimeString())

        const sid = getSimpleId()

        const session = {
            id: sid,
            datetime: Date.now(),
            inquiry: result.inquiry_type, //inquiryType,
            mode: 0,
            rate,
            items: messageItems,
            sentiment: result.output,
            summary: result.output,
        }

        try {

            const response = await fetch('/sessions/', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    session,
                })
            })

            if(!response.ok) {
                console.log('Oops, an error occurred', response.status)
            }

            const result = await response.json()

            router.push('/')

        } catch(error) {
            console.log(error)
        }

    }, [messageItems])

    const formatMessageData = (message, type) => {
        return {
            id: getSimpleId(),
            type,
            contents: message,
            datetime: Date.now(),
        }
    }

    const addMessageData = (role, str) => {

        const new_message = formatMessageData(str, role)
        
        setMessageItems((prevItems) => [...prevItems, ...[new_message]])

        scrollToTop()

    }

    const handleSubmit = async (e) => {
        e.preventDefault()

        if(loading) return

        console.log('submit...', (new Date()).toLocaleTimeString())

        setLoading(true)

        const message = inputText

        const previous = messageItems.map((item) => {
            return {
                role: item.type !== 'user' ? 'assistant' : 'user',
                content: item.contents,
            }
        })
        
        //setInputText('')

        addMessageData('user', message)
        
        try {
            
            const formData = JSON.stringify({
                files,
                orderData,
                fileData,
                previous,
                question: message,
            })

            const response = await fetch('/chat2/', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: formData,
            })

            if(!response.ok) {
                console.log('Oops, an error occurred', response.status)
            }

            const result = await response.json()

            console.log('result', result, (new Date()).toLocaleTimeString())

            if(result.hasOwnProperty('orderData')) {
                setOrderData(result.orderData)
            }

            if(result.hasOwnProperty('fileData')) {
                setFileData(result.fileData)
            }

            if(result.text.indexOf('SESSION-ENDED') >= 0) {
                setSessionEnd(true)
            }

            const retval = result.text.length > 0 ? result.text : setCaption('error-message')

            addMessageData('system', retval)

        } catch(error) {

            console.log(error)

            addMessageData('system', setCaption('error-message'))

            

        } finally {

            setInputText('')

            setLoading(false)

            setTimeout(() => {
                inputRef.current.focus()
            }, 200)

        }

    }
    
    const scrollToTop = () => {

        clearTimeout(timerRef.current)

        timerRef.current = setTimeout(() => {

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
                            
                            let text = item.contents

                            if(item.type !== 'user') {
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
                        onSubmit={handleSubmit}
                        noValidate>
                            <TextField 
                            //autoFocus={true}
                            disabled={loading}
                            fullWidth
                            //multiline
                            //maxRows={6}
                            inputRef={inputRef}
                            value={inputText}
                            placeholder={setCaption('write-message')}
                            onChange={(e) => setInputText(e.target.value)}
                            InputProps={{
                                endAdornment: (
                                    <InputAdornment position="end">
                                        <>
                                        <IconButton
                                        disabled={inputText.length === 0 || loading}
                                        onClick={() => setInputText('')}
                                        >
                                            <ClearIcon />
                                        </IconButton>
                                        <IconButton
                                        disabled={inputText.length === 0 || loading}
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