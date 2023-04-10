'use client'

import React from 'react'

import IconButton from '@mui/material/IconButton'
import ClearIcon from '@mui/icons-material/Clear'
import Rating from '@mui/material/Rating'

import sessions from '../lib/session'

import { getDateTime, formatMessage } from '../lib/utils'

import CustomTheme from './customtheme'

import useCaption from '../lib/usecaption'
import captions from '../assets/settings.json'

import classes from './sessions.module.css'

const getInquiryType = (n) => {
    return n === 1 ? 'order-inquiry' : n === 2 ? 'product-inquiry' : 'others'
}

const getMode = (n) => {
    return n > 0 ? 'voice' : 'chat'
}

export default function Sessions(props) {

    const setCaption = useCaption(captions)

    const [sessionItems, setSessionItems] = React.useState([])

    const [sessionId, setSessionId] = React.useState('')
    const [session, setSession] = React.useState(null)

    React.useEffect(() => {

        const initSession = async () => {
            await getSessions()
        }

        initSession()

    }, [])

    React.useEffect(() => {

        const handleSession = async () => {

            let s = await sessions.getSession(sessionId)

            let items = s.contents.items.map((item) => {
                return {
                    ...item,
                    sentiment: '',
                }
            })

            //console.log('[ITEMS]')
            //console.log(items)
            //console.log('[LOOP]')
            
            for(let i = 1; i < items.length; i++) {

                if(items[i].type === 'system') {

                    let tokens = items[i].contents.split('\n')

                    //console.log(tokens)

                    for(let k = 0; k < tokens.length; k++) {

                        if(tokens[k].indexOf('Customer-Sentiment:') >= 0) {
                            items[i - 1].sentiment = tokens[k].substr(20)
                            //items[i].contents = tokens.slice(1).join('\n').replace('SESSION-ENDED', '')
                            items[i].contents = tokens.slice(k + 1).join('\n')
                            break
                        }

                    }

                    //console.log(i, items[i].type, tokens[0])

                }
            }

            s.contents.items = items

            //console.log('session', s.contents)

            setSession(s.contents)

        }

        if(sessionId) {

            handleSession()

        }

    }, [sessionId])

    const getSessions = React.useCallback(async () => {

        const raw_items = await sessions.getSessions()
        const items = raw_items.map((item) => item.contents).sort((a, b) => {
            if (a.datetime > b.datetime) return -1
            if (a.datetime < b.datetime) return 1
            return 0
        })
        
        setSessionItems(items)

    }, [])

    /*
    {
                                session.items.map((item) => {
                                    if(item.type === 'assistant' || item.type === 'system') {

                                        const txt = formatMessage(item.contents) // item.contents.replace('Response:', '')

                                        return (
                                            <React.Fragment key={item.id}>
                                                <tr className={classes.tabRow}>
                                                    <td className={classes.tabCell}>{setCaption('role')}: {setCaption('system')}</td>
                                                    <td colSpan={3} className={classes.tabCell}>&nbsp;</td>
                                                </tr>
                                                <tr className={classes.tabRow}>
                                                    <td colSpan={4} className={classes.tabCell}>{txt}</td>
                                                </tr>
                                            </React.Fragment>
                                        )
                                    } else {
                                        return (
                                            <React.Fragment key={item.id}>
                                                <tr className={classes.tabRow}>
                                                    <td className={classes.tabCell}>{setCaption('role')}: {setCaption('customer')}</td>
                                                    <td colSpan={2} className={classes.tabCell}>&nbsp;</td>
                                                    <td className={classes.tabCell}>{setCaption('sentiment')}: { item?.sentiment }</td>
                                                </tr>
                                                <tr className={classes.tabRow}>
                                                    <td colSpan={4} className={classes.tabCell}>{item.contents}</td>
                                                </tr>
                                            </React.Fragment>
                                        )
                                    }
                                })
                            }*/

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
                                <tr key={item.id} onClick={() => setSessionId(item.id)} className={classes.tabRow}>
                                    <td className={classes.tabCell}>{ item.id }</td>
                                    <td className={`${classes.tabCell} ${classes.center}`}>{ getDateTime(item.datetime) }</td>
                                    <td className={`${classes.tabCell} ${classes.center}`}>{ setCaption(getInquiryType(item.inquiry)) }</td>
                                    <td className={`${classes.tabCell} ${classes.center}`}>{ setCaption(getMode(item.mode)) }</td>
                                    <td className={`${classes.tabCell} ${classes.center}`}>
                                        <CustomTheme>
                                            <Rating readOnly={true} value={parseInt(item?.rate)}/>
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
                (sessionId && session) &&
                <div className={classes.preview}>
                    <div className={classes.toolbar}>
                        <div className={classes.close}>
                            <CustomTheme>
                                <IconButton onClick={() => setSessionId('')}>
                                    <ClearIcon />
                                </IconButton>
                            </CustomTheme>
                        </div>
                    </div>
                    <table className={classes.table}>
                        <tbody>
                            <tr className={classes.tabRow}>
                                <td className={classes.tabCell}>{ session.id }</td>
                                <td className={classes.tabCell}>{ setCaption(getInquiryType(session.inquiry)) }</td>
                                <td className={classes.tabCell}>{ setCaption(getMode(session.mode)) }</td>
                                <td className={classes.tabCell} style={{width: '120px'}}>
                                    <CustomTheme>
                                        <Rating readOnly={true} value={parseInt(session?.rate)}/>
                                    </CustomTheme>
                                </td>
                                <td className={classes.tabCell} style={{textAlign: 'right'}}>{ getDateTime(session.datetime) }</td>
                            </tr>
                            <tr className={classes.tabRow}>
                                <td colSpan={5} className={classes.tabCell}>
                                    { setCaption('summary') }:<br />
                                    { session.sentiment.replace('Analysis:', '') }
                                </td>
                            </tr>
                            {
                                session.items.map((item) => {
                                    if(item.type === 'assistant' || item.type === 'system') {

                                        const txt = formatMessage(item.contents) // item.contents.replace('Response:', '')

                                        /*
                                        <React.Fragment key={item.id}>
                                                <tr className={classes.tabRow}>
                                                    <td className={classes.tabCell}>{setCaption('role')}: {setCaption('system')}</td>
                                                    <td colSpan={3} className={classes.tabCell}>&nbsp;</td>
                                                </tr>
                                                <tr className={classes.tabRow}>
                                                    <td colSpan={4} className={classes.tabCell}>{txt}</td>
                                                </tr>
                                            </React.Fragment>
                                        */
                                        return (
                                            <tr className={classes.tabRow} key={item.id}>
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
                                        /*
                                        <React.Fragment key={item.id}>
                                                <tr className={classes.tabRow}>
                                                    <td className={classes.tabCell}>{setCaption('role')}: {setCaption('customer')}</td>
                                                    <td colSpan={2} className={classes.tabCell}>&nbsp;</td>
                                                    <td className={classes.tabCell}>{setCaption('sentiment')}: { item?.sentiment }</td>
                                                </tr>
                                                <tr className={classes.tabRow}>
                                                    <td colSpan={4} className={classes.tabCell}>{item.contents}</td>
                                                </tr>
                                            </React.Fragment>
                                        */
                                        return (
                                            <tr className={classes.tabRow} key={item.id}>
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
        </div>
    )
}