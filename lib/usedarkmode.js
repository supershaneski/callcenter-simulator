'use client'

import React from 'react'

import useAppStore from '../stores/appstore'

export default function useDarkMode() {

    const setMode = useAppStore((state) => state.setMode)

    React.useEffect(() => {

        const handleModeChange = (e) => {
            
            setMode(e.matches)

        }

        window.matchMedia('(prefers-color-scheme: dark)').addEventListener('change', handleModeChange)
        
        setMode(window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches)

        return () => {

            try {

                window.matchMedia('(prefers-color-scheme: dark)').removeEventListener('change', handleModeChange)

            } catch(err) {
                //
            }
            
        }

    }, [])

}