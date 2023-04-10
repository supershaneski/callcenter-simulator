'use client'

import React from 'react'
//import PropTypes from 'prop-types'

import { useRouter } from 'next/navigation'

import Button from '@mui/material/Button'
import IconButton from '@mui/material/IconButton'
import SettingsIcon from '@mui/icons-material/Settings'

import useDarkMode from '../lib/usedarkmode'
import useCaption from '../lib/usecaption'
import useAppStore from '../stores/appstore'

import captions from '../assets/selectinquiry.json'
import CustomTheme from './customtheme'
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
    
    const handleSettingsClick = () => {

        router.push('/admin')

    }

    const gotoContact = (mode) => {

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
                        <CustomButton onClick={() => gotoContact(1)} sx={{mb: 3}}>{ setCaption('order-inquiry') }</CustomButton>
                        <CustomButton onClick={() => gotoContact(2)} sx={{mb: 3}}>{ setCaption('product-inquiry') }</CustomButton>
                        <CustomButton onClick={() => gotoContact(0)}>{ setCaption('others') }</CustomButton>
                    </div>
                </div>
            </div>
        </div>
    )
}