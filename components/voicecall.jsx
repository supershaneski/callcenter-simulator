'use client'

import React from 'react'

import { createPortal } from 'react-dom'
import { useRouter } from 'next/navigation'

import Typography from '@mui/material/Typography'
import Button from '@mui/material/Button'

import AgentIcon from '@mui/icons-material/SupportAgent'

import AnimatedBars from './animatedBars'

import CustomTheme from './customtheme'

import useDarkMode from '../lib/usedarkmode'

import useAppStore from '../stores/appstore'
import useCaption from '../lib/usecaption'
import captions from '../assets/voicecall.json'

import Loader from './loader'

import { formatMessage, getTimeDiff, getSimpleId } from '../lib/utils'

import classes from './voicecall.module.css'

const CustomAvatar = (props) => {
    return (
        <div className={classes.avatar}>
            <CustomTheme>{ props.children }</CustomTheme>
        </div>
    )
}

const minDecibels = -60
const maxPause = 2500

export default function VoiceCall() {

    useDarkMode()

    const router = useRouter()

    const setCaption = useCaption(captions)

    const inquiryType = useAppStore((state) => state.inquiryType)
    
    const abortControllerRef = React.useRef()
    const timeStart = React.useRef()

    const animFrame = React.useRef()
    const mediaRef = React.useRef()
    const chunksRef = React.useRef([])
    const recordRef = React.useRef(false)
    const countDownRef = React.useRef(false)
    const countRef = React.useRef(0)
    const timerCount = React.useRef()

    //const encodeType = React.useRef(0)
    const synthRef = React.useRef(null)
    const startRef = React.useRef(false)
    const allowSpeak = React.useRef(false)
    //const endCall = React.useRef(false)

    const [isCountDown, setCountDown] = React.useState(false)
    const [startTime, setStartTime] = React.useState(0)
    const [displayTime, setDisplayTime] = React.useState('00:00')
    
    const [isCallEnded, setCallEnded] = React.useState(false)
    const [isRecording, setRecording] = React.useState(false)
    const [isReady, setReady] = React.useState(false)
    
    const [errorMessage, setErrorMessage] = React.useState('')
    const [files, setFiles] = React.useState([])
    const [messageItems, setMessageItems] = React.useState([])
    const [isMounted, setMounted] = React.useState(false)

    const [openLoader, setOpenLoader] = React.useState(false)

    React.useEffect(() => {

        setMounted(true)

    }, [])

    React.useEffect(() => {

        if(isMounted) {

            getFiles()

        }

    }, [isMounted])

    React.useEffect(() => {

        if(files.length > 0 && !isCallEnded) {

            abortControllerRef.current = new AbortController()

            synthRef.current = window.speechSynthesis
            
            if (navigator.mediaDevices && navigator.mediaDevices.getUserMedia) {

                navigator.mediaDevices.getUserMedia({ audio: true }).then(handleStream).catch(handleError)
                
            } else {
        
                setErrorMessage('Media devices not supported')
                
            }

        }

        return () => {

            try {

                window.cancelAnimationFrame(animFrame.current)

                if(synthRef.current) {
                    synthRef.current.cancel()
                }

                if(abortControllerRef.current) {
                    abortControllerRef.current.abort()
                }

                if(mediaRef.current?.state && mediaRef.current.state !== 'inactive') {
                    mediaRef.current.stop()
                }

            } catch(error) {

                console.log(error)

            }
            
        }

    }, [files, isCallEnded])

    React.useEffect(() => {

        const handleSpeakOnEnd = () => {
            
            startRef.current = true

            allowSpeak.current = true

        }

        if(isReady) {

            setStartTime(Date.now())
            
            const index = Math.round(10 * Math.random()) > 5 ? 2 : 1

            const key = inquiryType === 2 ? 'product' : inquiryType === 1 ? 'order' : 'other'

            const greetings = setCaption(`greeting-${key}-${index}`)
            
            const system_message = {
                id: getSimpleId(),
                type: 'system',
                contents: greetings,
                datetime: Date.now(),
            }

            setMessageItems((prevItems) => [...prevItems, ...[system_message]])

            speakText(greetings, handleSpeakOnEnd)

        }

    }, [isReady])

    React.useEffect(() => {

        let timer = null

        if(startTime > 0) {

            timer = setInterval(() => {

                setDisplayTime(getTimeDiff(startTime))

            }, 1000)

        }

        return () => {
            clearInterval(timer)
        }

    }, [startTime])

    React.useEffect(() => {

        if(isCallEnded) {

            if(messageItems.length > 1) {

                setMounted(false)
                setStartTime(false)

                setOpenLoader(true)

            } else {

                router.push('/')

            }

        }

    }, [isCallEnded])

    React.useEffect(() => {

        if(isCountDown) {

            timerCount.current = setInterval(() => {
                
                countRef.current += 100

            }, 100)

        }

        return () => {
            clearInterval(timerCount.current)
        }

    }, [isCountDown])

    const handleCloseLoader = React.useCallback(async (rate) => {

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
    
    const handleError = React.useCallback((error) => {
        
        console.log(error)

        setErrorMessage(JSON.stringify(error))

    }, [])

    const handleStream = (stream) => {
        
        try {

            mediaRef.current = new MediaRecorder(stream, {
                mimeType: 'audio/webm;codecs=opus',
                audioBitsPerSecond: 128000,
            })

        } catch(error) {

            console.log(error)

            mediaRef.current = new MediaRecorder(stream, {
                audioBitsPerSecond: 128000,
            })

        }
        
        mediaRef.current.addEventListener('dataavailable', handleData)
        mediaRef.current.addEventListener("stop", handleStop)

        setReady(true)

        handleAudioData(stream)
        
    }

    const handleData = (e) => {

        chunksRef.current.push(e.data)

    }

    const handleStop = React.useCallback(async () => {

        allowSpeak.current = false // this prevents talking simultaneously

        const blob = new Blob(chunksRef.current, { type: 'audio/webm;codecs=opus' })
        
        //const duration = (Date.now() - timeStart.current) / 1000
        //blob.duration = duration
        
        const name = `file${Date.now()}` + Math.round(Math.random() * 100000) + `.webm`
        
        const file = new File([blob], name, { type: 'audio/webm' })

        chunksRef.current = []

        let errorFlag = false

        let question = ''

        try {

            let formData = new FormData()
            formData.append('file', file, name)
            formData.append('name', name)
            
            const response = await fetch('/voice/', {
                method: 'POST',
                headers: {
                    'Accept': 'application/json',
                },
                body: formData,
                signal: abortControllerRef.current.signal,
            })

            if(!response.ok) {

                console.log('[whisper]', 'Oops, error occurred', response.status)
            
            }

            const result = await response.json()

            question = result.text

        } catch(error) {

            console.log(error)

            errorFlag = true

        }

        if(errorFlag || question.length === 0) {
            allowSpeak.current = true
            return
        }
        
        const user_message = {
            id: getSimpleId(),
            type: 'user',
            contents: question,
            datetime: timeStart.current,
        }

        setMessageItems((prevItems) => [...prevItems, ...[user_message]])
        
        let results = []

        try {

            const res = await fetch('/embeddings/', {
                method: 'POST',
                headers: {
                    'Accept': 'application/json',
                },
                body: JSON.stringify({
                    files: files,
                    question: question,
                    maxResults: 10,
                }),
            })


            if(!res.ok) {

                console.log('[embeddings]', 'Oops, an error occurred.', res.status)
            
            }

            const result_item = await res.json()

            results = result_item.searchResults
        
        } catch(error) {

            console.log(error)

            errorFlag = true

        }

        if(errorFlag || results.length === 0) {
            allowSpeak.current = true
            return
        }

        let text = ''

        const previous = messageItems.map((item) => {
            return {
                role: item.type !== 'user' ? 'assistant' : 'user',
                content: item.contents,
            }
        })

        try {

            const response_chat = await fetch('/chat/', {
                method: 'POST',
                headers: {
                  'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                  question: question,
                  previous: previous,
                  inquiry: inquiryType,
                  fileChunks: results,
                  orderData: '',
                }),
            })

            if(!response_chat.ok) {

                console.log('[chat]', 'Oops, an error occurred!', response_chat.status)
            
            }

            const retval = await response_chat.json()

            text = retval.text

        } catch(error) {

            console.log(error)

            errorFlag = true
            
        }

        if(errorFlag || text.length === 0) {
            allowSpeak.current = true
            return
        }

        const system_message = {
            id: getSimpleId(),
            type: 'system',
            contents: text,
            datetime: Date.now(),
        }

        setMessageItems((prevItems) => [...prevItems, ...[system_message]])

        const message = formatMessage(text)

        speakText(message, () => {

            allowSpeak.current = true

        })

    }, [files, messageItems])

    const speakText = React.useCallback((txt = '', callback = undefined) => {
        
        if(!synthRef.current) return

        if(txt === null) return
        if(typeof txt === 'undefined')
        if(txt.length === 0) return

        const utterThis = new SpeechSynthesisUtterance(txt);

        const voiceName = navigator.language.toUpperCase().indexOf('EN') >= 0 ? 'Alex' : 'Kyoko'

        const voices = synthRef.current.getVoices();
        for (const voice of voices) {
            if (voice.name === voiceName) { //e.g. Fiona, Daniel, Kyoko, Google 日本語
                utterThis.voice = voice;
            }
        }
        
        utterThis.pitch = 1.0
        utterThis.rate = 1.0

        utterThis.onstart = () => {

            console.log('[Start Speak]', (new Date()).toLocaleTimeString())

        }

        utterThis.onend = () => {
            
            console.log('[End Speak]', (new Date()).toLocaleTimeString())
            
            if(callback) {

                callback()

            }

        }

        synthRef.current.speak(utterThis);

    }, [isMounted])

    const handleAudioData = (stream) => {

        const audioContext = new AudioContext()
        const audioStreamSource = audioContext.createMediaStreamSource(stream)
        const analyser = audioContext.createAnalyser()
        analyser.maxDecibels = -10
        analyser.minDecibels = minDecibels
        audioStreamSource.connect(analyser)

        const bufferLength = analyser.frequencyBinCount
        const domainData = new Uint8Array(bufferLength)

        const detectSound = () => {

            let soundDetected = false

            analyser.getByteFrequencyData(domainData)

            for (let i = 0; i < bufferLength; i++) {
                if (domainData[i] > 0) {
                    soundDetected = true
                }
            }

            if(soundDetected === true) {

                if(recordRef.current) {
                    
                    if(countDownRef.current) {

                        setCountDown(false)
                        countDownRef.current = false
                        countRef.current = 0

                    }

                } else {
                    
                    if(startRef.current && allowSpeak.current) {

                        //timeStartRef.current = Date.now()
                        timeStart.current = Date.now()

                        setRecording(true)
                        recordRef.current = true
                        
                        setCountDown(false)
                        countDownRef.current = false
                        countRef.current = 0

                        mediaRef.current.start()

                    }

                }
                
            } else {

                if(recordRef.current) {

                    if(countDownRef.current) {
                        
                        if(countRef.current >= maxPause) {

                            if(startRef.current) {
                            
                                setRecording(false)
                                recordRef.current = false
                                
                                setCountDown(false)
                                countDownRef.current = false
                                countRef.current = 0

                                mediaRef.current.stop()

                            }

                        }

                    } else {

                        setCountDown(true)
                        countDownRef.current = true
                        countRef.current = 0

                    }

                }
                
            }

            animFrame.current = window.requestAnimationFrame(detectSound)

        }

        animFrame.current = window.requestAnimationFrame(detectSound)
        
    }

    const handleClose = () => {

        setCallEnded(true)
        //endCall.current = true

    }

    const setInquiryCaption = () => {
        const key = inquiryType === 1 ? 'order-inquiry' : inquiryType === 2 ? 'product-inquiry' : 'others'
        return setCaption(key)
    }
    
    return (
        <div className={classes.container}>
            <div className={classes.center}>
                <div className={classes.banner}>
                    <CustomAvatar>
                        <AgentIcon sx={{fontSize: '3.5rem'}} />
                    </CustomAvatar>
                </div>
                <div className={classes.mode}>
                    <div className={classes.inquiry}>
                        <div className={classes.inquiryText}>
                            <CustomTheme>
                                <Typography variant="h4">
                                { setInquiryCaption() }
                                </Typography>
                            </CustomTheme>
                        </div>
                    </div>
                    <div className={classes.timeElapsed}>
                    {
                        !errorMessage &&
                        <CustomTheme>
                            <Typography>{displayTime}</Typography>
                        </CustomTheme>
                    }
                    {
                        errorMessage &&
                        <CustomTheme>
                            <Typography color="error">{errorMessage}</Typography>
                        </CustomTheme>
                    }
                    </div>
                    <div className={classes.voiceStatus}>
                    {
                        !errorMessage &&
                        <AnimatedBars start={isRecording && !isCallEnded} />
                    }
                    </div>
                </div>
                <div className={classes.action}>
                    <div className={classes.cancel}>
                        <CustomTheme>
                            <Button
                            onClick={handleClose}
                            disableElevation
                            fullWidth
                            variant='contained'
                            color="error"
                            size='large'
                            >{ setCaption('close') }</Button>
                        </CustomTheme>
                    </div>
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