'use client'

import React from 'react'
import PropTypes from 'prop-types'

import CircularProgress from '@mui/material/CircularProgress'
//import Box from '@mui/material/Box'
//import Typography from '@mui/material/Typography'

import LoadingButton from '@mui/lab/LoadingButton'
import Button from '@mui/material/Button'
import Box from '@mui/material/Box'
import Rating from '@mui/material/Rating'
import Typography from '@mui/material/Typography'

import CustomTheme from './customtheme'

import captions from '../assets/chat.json'

import useCaption from '../lib/usecaption'

import classes from './loader.module.css'

export default function Loader({ 
    //disabled = true, 
    onClick = undefined
}) {

    const setCaption = useCaption(captions)

    const [value, setValue] = React.useState(0)
    const [disabled, setDisabled] = React.useState(false)

    /*React.useEffect(() => {
        console.log("loader mounted")
    }, [])*/

    /*
    <Box sx={{ color: '#fff9', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                    <CircularProgress color='inherit' />
                    <Typography sx={{ mt: 5 }}>{ setCaption('wait-message') }</Typography>
                </Box>
    */

    const handleClick = () => {
        
        setDisabled(true)
        onClick(value)

    }
    
    /*
    sx={{ 
                    borderRadius: '6px', 
                    padding: '3rem', 
                    //backgroundColor: '#E6EFFF', 
                    backgroundColor: 'primary.main',
                    display: 'flex', 
                    flexDirection: 'column', 
                    alignItems: 'center',
                    boxShadow: 2,
                }}*/
    return (
        <div className={classes.container}>
            <CustomTheme>
                <div className={classes.backdrop}>
                    <Typography component="legend" sx={{mb: 1}}>{ setCaption('thank-you') }</Typography>
                    <Rating
                    //disabled={disabled}
                    readOnly={disabled}
                    size="large"
                    value={value}
                    onChange={(event, newValue) => {
                    setValue(newValue);
                    }}
                    />
                    <LoadingButton color="error" loading={disabled} onClick={handleClick} sx={{mt: 3}} variant='contained' disableElevation>
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