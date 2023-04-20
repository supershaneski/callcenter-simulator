'use client'

import React from 'react'
import { createPortal } from 'react-dom'

import IconButton from '@mui/material/IconButton'
import ClearIcon from '@mui/icons-material/Clear'
import Rating from '@mui/material/Rating'

import useCaption from '../lib/usecaption'
import { getDateTime, formatMessage } from '../lib/utils'

import LoadingProgress from './loading'

import CustomTheme from './customtheme'
import captions from '../assets/settings.json'
import classes from './sessions.module.css'

const getInquiryType = (n) => {
    return n === 1 ? 'order-inquiry' : n === 2 ? 'product-inquiry' : 'others'
}

const getMode = (n) => {
    return n > 0 ? 'voice' : 'chat'
}

export default function Sessions() {

    const setCaption = useCaption(captions)

    const [sessionItems, setSessionItems] = React.useState([])
    const [session, setSession] = React.useState(null)
    const [openLoader, setOpenLoader] = React.useState(true)

    React.useEffect(() => {

        getSessions()

    }, [])
    
    const getSessions = React.useCallback(async () => {

        try {

            const response = await fetch('/sessions/', {
                method: 'GET',
                headers: {
                    'Content-Type': 'application/json',
                }
            })

            if(!response.ok) {
                console.log('Oops, an error occurred', response.status)
            }

            const { items } = await response.json()

            const sorted_items = items.sort((a, b) => {
                if(a.datetime > b.datetime) return -1
                if(a.datetime < b.datetime) return 1
                return 0
            })
            
            setSessionItems(sorted_items)

            setOpenLoader(false)

        } catch(error) {

            console.log(error)

            setOpenLoader(false)

        }

    }, [])

    const handleSessionMessage = (id) => (e) => {
        
        const msg = session.items.find((item) => item.id === id)
        
        console.log(msg)

    }

    const handleSelectSession = (id) => (e) => {
        
        let s = sessionItems.find((item) => item.id === id)

        for(let i = 1; i < s.items.length; i++) {
            
            if(s.type !== 'user') {
                
                let k = i - 1

                let tokens = s.items[i].contents.split('\n')

                for(let n = 0; n < tokens.length; n++) {
                    if(tokens[n].indexOf('Customer-Sentiment:') >= 0) {
                        let token = tokens[n].split(':')
                        if(token.length > 1) {
                            let str = token[1].trim()
                            s.items[k].sentiment = str
                        }
                        break
                    }
                }

            }

        }

        setSession(s)

    }

    return (
        <div className={classes.container}>
            <div className={classes.main}>
                <table className={classes.table}>
                    <thead>
                        <tr className={classes.tabRow}>
                            <th className={classes.tabHead}>{ setCaption('session-id') }</th>
                            <th className={classes.tabHead}>{ setCaption('datetime') }</th>
                            <th className={classes.tabHead}>{ setCaption('inquiry') }</th>
                            <th className={classes.tabHead}>{ setCaption('mode') }</th>
                            <th className={classes.tabHead}>{ setCaption('rating') }</th>
                            <th className={classes.tabHead}>{ setCaption('summary') }</th>
                        </tr>
                    </thead>
                    <tbody>
                    {
                        sessionItems.length === 0 &&
                        <tr className={classes.tabRow}>
                            <td colSpan={6} className={`${classes.empty} ${classes.center}`}>{ setCaption('no-session') }</td>
                        </tr>
                    }
                    {
                        sessionItems.length > 0 &&
                        sessionItems.map((item) => {
                            return (
                                <tr 
                                key={item.id} 
                                onClick={handleSelectSession(item.id)}
                                className={classes.tabRow}
                                >
                                    <td className={classes.tabCell}>{ item.id }</td>
                                    <td className={`${classes.tabCell} ${classes.center}`}>{ getDateTime(item.datetime) }</td>
                                    <td className={`${classes.tabCell} ${classes.center}`}>{ setCaption(getInquiryType(item.inquiry)) }</td>
                                    <td className={`${classes.tabCell} ${classes.center}`}>{ setCaption(getMode(item.mode)) }</td>
                                    <td className={`${classes.tabCell} ${classes.center}`}>
                                        <CustomTheme>
                                            <Rating 
                                            readOnly={true} 
                                            value={parseInt(item?.rate)}
                                            size="small"
                                            />
                                        </CustomTheme>
                                    </td>
                                    <td className={classes.tabCell}>
                                        <p className={classes.summary}>{ item.sentiment.replace('Analysis:', '') }</p>
                                    </td>
                                </tr>
                            )
                        })
                    }
                    </tbody>
                </table>
            </div>
            {
                session &&
                <div className={classes.preview}>
                    <div className={classes.toolbar}>
                        <div className={classes.close}>
                            <CustomTheme>
                                <IconButton 
                                //onClick={() => setSessionId('')}
                                onClick={() => setSession(null)}
                                >
                                    <ClearIcon />
                                </IconButton>
                            </CustomTheme>
                        </div>
                    </div>
                    <table className={classes.table}>
                        <thead>
                            <tr className={classes.tabRow}>
                                <th className={classes.tabHead}>{ session.id }</th>
                                <th className={classes.tabHead}>{ setCaption(getInquiryType(session.inquiry)) }</th>
                                <th className={classes.tabHead}>{ setCaption(getMode(session.mode)) }</th>
                                <th className={classes.tabHead} style={{width: '80px'}}>
                                    <CustomTheme>
                                        <Rating 
                                        readOnly={true} 
                                        size="small"
                                        value={parseInt(session?.rate)}/>
                                    </CustomTheme>
                                </th>
                                <th className={classes.tabHead} style={{textAlign: 'right'}}>{ getDateTime(session.datetime) }</th>
                            </tr>
                        </thead>
                        <tbody>
                            <tr className={classes.tabRow}>
                                <td colSpan={5} className={classes.tabCell}>
                                    { setCaption('summary') }:<br />
                                    { session.sentiment.replace('Analysis:', '') }
                                </td>
                            </tr>
                            {
                                session.items.map((item) => {
                                    if(item.type === 'assistant' || item.type === 'system') {

                                        const txt = formatMessage(item.contents)

                                        return (
                                            <tr className={classes.tabRow} key={item.id} onClick={handleSessionMessage(item.id)}>
                                                <td colSpan={5} className={classes.tabCell} style={{width: '100%'}}>
                                                    <table className={classes.tableData}>
                                                        <tbody>
                                                            <tr className={classes.tabDataRow}>
                                                                <td className={classes.tabDataCell} style={{width: '25%'}}>{setCaption('system')}</td>
                                                                <td className={classes.tabDataCell} style={{width: '25%'}}>{item.id}</td>
                                                                <td className={classes.tabDataCell} style={{width: '25%'}}>&nbsp;</td>
                                                                <td className={classes.tabDataCell} style={{width: '25%', textAlign: 'right'}}>{item?.datetime ? getDateTime(item.datetime) : '---' }</td>
                                                            </tr>
                                                            <tr className={classes.tabDataRow}>
                                                                <td className={classes.tabDataCell} colSpan={4} style={{paddingTop: '1rem'}}>{txt}</td>
                                                            </tr>
                                                        </tbody>
                                                    </table>
                                                </td>
                                            </tr>
                                        )
                                    } else {
                                        
                                        return (
                                            <tr className={classes.tabRow} key={item.id} onClick={handleSessionMessage(item.id)}>
                                                <td colSpan={5} className={classes.tabCell} style={{width: '100%'}}>
                                                    <table className={classes.tableData}>
                                                        <tbody>
                                                            <tr className={classes.tabDataRow}>
                                                                <td className={classes.tabDataCell} style={{width: '25%'}}>{setCaption('customer')}</td>
                                                                <td className={classes.tabDataCell} style={{width: '25%'}}>{item.id}</td>
                                                                <td className={classes.tabDataCell} style={{width: '25%'}}>{item.sentiment ? <>{setCaption('sentiment')}: { item?.sentiment }<br /></> : ``}</td>
                                                                <td className={classes.tabDataCell} style={{width: '25%', textAlign: 'right'}}>{item?.datetime ? getDateTime(item.datetime) : '---' }</td>
                                                            </tr>
                                                            <tr className={classes.tabDataRow}>
                                                                <td className={classes.tabDataCell} colSpan={4} style={{paddingTop: '1rem'}}>
                                                                {item.contents}
                                                                </td>
                                                            </tr>
                                                        </tbody>
                                                    </table>
                                                </td>
                                            </tr>
                                        )
                                    }
                                })
                            }
                        </tbody>
                    </table>
                </div>
            }
            {
                openLoader && createPortal(
                    <LoadingProgress />,
                    document.body,
                )
            }
        </div>
    )
}