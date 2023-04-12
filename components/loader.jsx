'use client'

import React from 'react'
import PropTypes from 'prop-types'

import LoadingButton from '@mui/lab/LoadingButton'
import Rating from '@mui/material/Rating'
import Typography from '@mui/material/Typography'

import CustomTheme from './customtheme'
import captions from '../assets/chat.json'
import useCaption from '../lib/usecaption'

import classes from './loader.module.css'

export default function Loader({ 
    onClick = undefined
}) {

    const setCaption = useCaption(captions)

    const [value, setValue] = React.useState(0)
    const [disabled, setDisabled] = React.useState(false)

    const handleClick = () => {
        
        setDisabled(true)
        onClick(value)

    }

    return (
        <div className={classes.container}>
            <CustomTheme>
                <div className={classes.backdrop}>
                    <Typography 
                    component="legend" 
                    sx={{mb: 1}}>
                        { setCaption('thank-you') }
                    </Typography>
                    <Rating
                    readOnly={disabled}
                    size="large"
                    value={value}
                    onChange={(_, newValue) => {
                    setValue(newValue);
                    }}
                    />
                    <LoadingButton 
                    color="error" 
                    loading={disabled} 
                    onClick={handleClick} 
                    sx={{mt: 3}} 
                    variant='contained' 
                    disableElevation>
                        { setCaption('close-session') }
                    </LoadingButton>
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