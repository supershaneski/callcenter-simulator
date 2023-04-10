'use client'

import React from 'react'
import PropTypes from 'prop-types'

import captions from '../assets/session.json'
import useCaption from '../lib/usecaption'

import classes from './endsession.module.css'

export default function EndSession({ onClick }) {

    const setCaption = useCaption(captions)

    return (
        <div onClick={onClick} className={classes.container}>
            <span>{ setCaption('end-session') }</span>
        </div>
    )
}

EndSession.propTypes = {
    /**
     * Click event handler
     */
    onClick: PropTypes.func,
}