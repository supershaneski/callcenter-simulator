'use client'

import React from 'react'
import PropTypes from 'prop-types'

import LoadingButton from '@mui/lab/LoadingButton'
import Rating from '@mui/material/Rating'
import Typography from '@mui/material/Typography'
import CircularProgress from '@mui/material/CircularProgress'

import CustomTheme from './customtheme'
import captions from '../assets/chat.json'
import useCaption from '../lib/usecaption'

import classes from './loading.module.css'

export default function Loader({ 
    onClick = undefined
}) {

    return (
        <div className={classes.container}>
            <CustomTheme>
                <div className={classes.backdrop}>
                    <CircularProgress color='inherit' />
                </div>
            </CustomTheme>
        </div>
    )
}

Loader.propTypes = {
    /**
     * Click event handler
     */
    onClick: PropTypes.func,
}