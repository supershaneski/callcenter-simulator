import React from 'react'

import { createTheme, ThemeProvider } from '@mui/material/styles'

import NoSsr from '@mui/base/NoSsr'

import useAppStore from '../stores/appstore'

const darkTheme = createTheme({
    palette: {
        mode: 'dark',
    }
})

const lightTheme = createTheme({
    palette: {
        mode: 'light',
    }
})

export default function CustomTheme({ children }) {

    const isDarkMode = useAppStore((state) => state.darkMode)

    return (
        <NoSsr>
            <ThemeProvider theme={isDarkMode ? darkTheme : lightTheme}>
                { children }
            </ThemeProvider>
        </NoSsr>
    )
}