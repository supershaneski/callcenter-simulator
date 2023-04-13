'use client'

import React from 'react'
import PropTypes from 'prop-types'

import { useRouter } from 'next/navigation'

import Typography from '@mui/material/Typography'
import Button from '@mui/material/Button'

import MessageIcon from '@mui/icons-material/Message'
import CallIcon from '@mui/icons-material/Call'
import AgentIcon from '@mui/icons-material/SupportAgent'

import AnimatedBars from './animatedBars'

import CustomTheme from './customtheme'

import useDarkMode from '../lib/usedarkmode'

import useAppStore from '../stores/appstore'
import useCaption from '../lib/usecaption'
import captions from '../assets/voicecall.json'

import { formatNumber, getTimeDiff } from '../lib/utils'

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

    const setMode = useAppStore((state) => state.setMode)
    const inquiryType = useAppStore((state) => state.inquiryType)
    
    const abortControllerRef = React.useRef()

    const animFrame = React.useRef()
    const mediaRef = React.useRef()
    const chunksRef = React.useRef()
    const recordRef = React.useRef(false)
    const countDownRef = React.useRef(false)
    const countRef = React.useRef(0)
    const timerCount = React.useRef()

    const [isCountDown, setCountDown] = React.useState(false)
    const [startTime, setStartTime] = React.useState(0)
    const [displayTime, setDisplayTime] = React.useState('00:00')
    
    const [isCallEnded, setCallEnded] = React.useState(false)
    const [isRecording, setRecording] = React.useState(false)
    const [isReady, setReady] = React.useState(false)

    const [errorMessage, setErrorMessage] = React.useState('')

    React.useEffect(() => {

        abortControllerRef.current = new AbortController()
        
        if (navigator.mediaDevices && navigator.mediaDevices.getUserMedia) {

            navigator.mediaDevices.getUserMedia({ audio: true }).then(handleStream).catch(handleError)
            
        } else {
    
            setErrorMessage('Media devices not supported')
            
        }

        //setStartTime(Date.now())

        return () => {

            try {

                window.cancelAnimationFrame(animFrame.current)

                if(abortControllerRef.current) {
                    abortControllerRef.current.abort()
                }

                if(mediaRef.current.state !== 'inactive') {
                    mediaRef.current.stop()
                }

            } catch(err) {

                console.log(err)

            }
            
        }

    }, [])

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

            router.push('/')

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

    ///////////

    const handleError = React.useCallback((err) => {
        
        setErrorMessage(err)

    }, [])

    const handleStream = (stream) => {
        
        console.log("ready")

        setStartTime(Date.now())
        setReady(true)

        mediaRef.current = new MediaRecorder(stream)
        mediaRef.current.addEventListener('dataavailable', handleData)
        mediaRef.current.addEventListener("stop", handleStop)

        handleAudioData(stream)

    }

    const handleData = (e) => {

        chunksRef.current.push(e.data)

    }

    const handleStop = () => {

        const blob = new Blob(chunksRef.current, {type: 'audio/webm;codecs=opus'})
        
        const name = `file${Date.now()}` + Math.round(Math.random() * 100000)
        
        const file = new File([blob], `${name}.m4a`)

        chunksRef.current = []

        console.log('stopped', name)

    }

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
                    
                    setRecording(true)
                    recordRef.current = true
                    
                    setCountDown(false)
                    countDownRef.current = false
                    countRef.current = 0

                    //mediaRef.current.start()

                    console.log("START RECORDING")

                }
                
            } else {

                if(recordRef.current) {

                    if(countDownRef.current) {
                        
                        if(countRef.current >= maxPause) {

                            setRecording(false)
                            recordRef.current = false
                            
                            setCountDown(false)
                            countDownRef.current = false
                            countRef.current = 0

                            //mediaRef.current.stop()

                            console.log("STOP RECORDING")

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

    ///////////////

    const handleClose = () => {

        setCallEnded(true)

    }

    const setInquiryCaption = () => {
        const key = inquiryType === 1 ? 'order-inquiry' : inquiryType === 2 ? 'product-inquiry' : 'others'
        return setCaption(key)
    }

    const handleTest = async () => {
        try {

            const response = await fetch('/voice/', {
                method: 'POST',
                headers: {
                    'Accept': 'application/json',
                },
                body: JSON.stringify({
                    payload: Date.now(),
                })
            })

            if(!response.ok) {
                console.log('Oops, an error occurred', response.status)
            }

            const result = await response.json()

            console.log('test', result)

        } catch(error) {
            
            console.log(error)

        }
    }
    
    return (
        <div className={classes.container}>
            <div className={classes.center}>
                <div className={classes.banner} onClick={handleTest}>
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
                            <Typography color="error">{ errorMessage }</Typography>
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
        </div>
    )
}