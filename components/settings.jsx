'use client'

import React from 'react'

import { useRouter } from 'next/navigation'

import Tabs from '@mui/material/Tabs'
import Tab from '@mui/material/Tab'
import Box from '@mui/material/Box'
import IconButton from '@mui/material/IconButton'
import ClearIcon from '@mui/icons-material/Clear'

import DataSource from './datasource'
import Sessions from './sessions'
import Orders from './orders'
import CustomTheme from './customtheme'

import useDarkMode from '../lib/usedarkmode'
import useCaption from '../lib/usecaption'
import captions from '../assets/settings.json'
import classes from './settings.module.css'

function TabPanel(props) {
    const { children, value, index, ...other } = props
    return (
        <div
        role="tabpanel"
        hidden={value !== index}
        id={`simple-tabpanel-${index}`}
        aria-labelledby={`simple-tab-${index}`}
        {...other}>
            {value === index && (
                <Box sx={{ p: 3 }}>
                    { children }
                </Box>
            )}
        </div>
    )
}

export default function Settings() {

    useDarkMode()

    const router = useRouter()

    const setCaption = useCaption(captions)

    const [value, setValue] = React.useState(0)
    
    const handleChange = (val) => {
        setValue(val)
    }

    const handleClose = () => {
        router.push('/')
    }

    return (
        <div className={classes.container}>
            <div className={classes.main}>
                <div className={classes.appBar}>
                    <div className={classes.appTitle}>
                        <h4 className={classes.appTitleText}>{ setCaption('settings') }</h4>
                    </div>
                    <CustomTheme>
                        <IconButton onClick={handleClose} sx={{mr: 1}}>
                            <ClearIcon />
                        </IconButton>
                    </CustomTheme>
                </div>
                <div className={classes.inner}>
                    <CustomTheme>
                        <Box sx={{ borderBottom: 1, borderColor: 'divider' }}>
                            <Tabs value={value} onChange={(e, v) => handleChange(v)}>
                                <Tab label={setCaption('data-source')} />
                                <Tab label={setCaption('sessions')} />
                                <Tab label={setCaption('orders')} />
                            </Tabs>
                        </Box>
                    </CustomTheme>
                    <TabPanel value={value} index={0}>
                        <DataSource />
                    </TabPanel>
                    <TabPanel value={value} index={1}>
                        <Sessions />
                    </TabPanel>
                    <TabPanel value={value} index={2}>
                        <Orders />
                    </TabPanel>
                </div>
            </div>
        </div>
    )
}