'use client'

import React from 'react'
//import PropTypes from 'prop-types'

import { useRouter } from 'next/navigation'

import Typography from '@mui/material/Typography'
import Button from '@mui/material/Button'
import MessageIcon from '@mui/icons-material/Message'
import CallIcon from '@mui/icons-material/Call'

import useAppStore from '../stores/appstore'
import useDarkMode from '../lib/usedarkmode'
import useCaption from '../lib/usecaption'
import captions from '../assets/selectmode.json'

import CustomTheme from './customtheme'
import classes from './selectmode.module.css'

const CustomButton = ({ 
    icon = 0,
    onClick = undefined,
}) => {
    return (
        <div onClick={onClick} className={classes.button}>
            <div className={classes.inner}>
                <CustomTheme>
                { 
                    icon > 0 ? <CallIcon sx={{fontSize: '2rem'}} /> : <MessageIcon sx={{fontSize: '2rem'}} /> 
                }
                </CustomTheme>
            </div>
        </div>
    )
}

export default function SelectMode() {

    useDarkMode()

    const router = useRouter()
    
    const inquiryType = useAppStore((state) => state.inquiryType)
    const setContact = useAppStore((state) => state.setContact)
    
    const setCaption = useCaption(captions)

    const setInquiryCaption = () => {
        const key = inquiryType === 1 ? 'order-inquiry' : inquiryType === 2 ? 'product-inquiry' : 'others'
        return setCaption(key)
    }

    const handleCancel = () => {

        router.push('/')

    }
    
    const gotoContact = (mode) => {

        if(mode > 0) return // voice-call

        setContact(mode)
        
        setTimeout(() => {

            router.push(`/contact/${mode > 0 ? 'voice' : 'chat'}/`)

        }, 300)

    }

    const timeEnable = () => {
        let s = ''
        const time = setInterval(() => {
            s = (new Date()).toLocaleTimeString()
        }, 100)
    }

    return (
        <div className={classes.container}>
            <div className={classes.center}>
                <div className={classes.banner}>
                    <CustomTheme>
                        <Typography variant="h4" sx={{ textAlign: 'center'}}>
                            { setInquiryCaption() }
                        </Typography>
                    </CustomTheme>
                </div>
                <div className={classes.mode}>
                    <CustomButton icon={1} onClick={() => gotoContact(1)} />
                    <CustomButton icon={0} onClick={() => gotoContact(0)} />
                </div>
                <div className={classes.action}>
                    <div className={classes.cancel}>
                        <CustomTheme>
                            <Button
                            onClick={handleCancel}
                            disableElevation
                            fullWidth
                            variant='contained'
                            color="error"
                            size='large'
                            >{ setCaption('cancel') }</Button>
                        </CustomTheme>
                    </div>
                </div>
            </div>
        </div>
    )
}