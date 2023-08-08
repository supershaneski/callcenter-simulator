'use client'

import React from 'react'
import PropTypes from 'prop-types'

import NoSsr from '@mui/material/NoSsr'
import AgentIcon from '@mui/icons-material/SupportAgent'

import classes from './animatedIcon.module.css'

/*
<NoSsr>
                        <AgentIcon />
                    </NoSsr>
*/
export default function AnimatedIcon({
    isAnimated = true,
    children,
}) {
    const classIcon = isAnimated ? [classes.line, classes.animated].join(' ') : classes.line
    return (
        <div className={classes.container}>
            <div className={classes.icon}>
                <div className={classIcon} />
                <div className={classes.avatar}>
                    {
                        children
                    }
                </div>
            </div>
        </div>
    )
}

AnimatedIcon.propTypes = {
    /**
     * animates icon
     */
    isAnimated: PropTypes.bool,
}