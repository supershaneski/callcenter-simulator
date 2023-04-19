'use client'

import React from 'react'

import { createPortal } from 'react-dom'
import { useRouter } from 'next/navigation'

import Button from '@mui/material/Button'
import IconButton from '@mui/material/IconButton'
import SettingsIcon from '@mui/icons-material/Settings'

import LoadingProgress from './loading'
import CustomTheme from './customtheme'

import useDarkMode from '../lib/usedarkmode'
import useAppStore from '../stores/appstore'
import useCaption from '../lib/usecaption'
import captions from '../assets/selectinquiry.json'

import classes from './selectinquiry.module.css'

const CustomButton = (props) => {
    return (
        <CustomTheme>
            <Button 
            onClick={props.onClick}
            fullWidth
            disableElevation
            variant='contained'
            size='large'
            sx={props.sx}
            >{ props.children }</Button>
        </CustomTheme>
    )
}

export default function SelectInquiry() {

    useDarkMode()

    const router = useRouter()

    const setCaption = useCaption(captions)

    const setAppState = useAppStore((state) => state.setApp)

    const [loading, setLoading] = React.useState(false)
    
    const handleSettingsClick = () => {

        setLoading(true)

        router.push('/admin')

    }

    const handleSelect = (mode) => (e) => {
        
        setLoading(true)

        setAppState(mode, 0, '')

        router.push(`/contact/`)

    }

    return (
        <div className={classes.container}>
            <div className={classes.header}>
                <CustomTheme>
                    <IconButton onClick={handleSettingsClick} sx={{ mr: 1 }}>
                        <SettingsIcon />
                    </IconButton>
                </CustomTheme>
            </div>
            <div className={classes.main}>
                <div className={classes.center}>
                    <div className={classes.buttons}>
                        <CustomButton onClick={handleSelect(1)} sx={{mb: 3}}>{ setCaption('order-inquiry') }</CustomButton>
                        <CustomButton onClick={handleSelect(2)} sx={{mb: 3}}>{ setCaption('product-inquiry') }</CustomButton>
                        <CustomButton onClick={handleSelect(0)}>{ setCaption('others') }</CustomButton>
                    </div>
                </div>
            </div>
            {
                loading && createPortal(
                    <LoadingProgress />,
                    document.body,
                )
            }
        </div>
    )
}