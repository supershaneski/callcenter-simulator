import React from 'react'
import PropTypes from 'prop-types'

import Avatar from '@mui/material/Avatar'
import IconButton from '@mui/material/IconButton'
import PersonIcon from '@mui/icons-material/Person'
import ClearIcon from '@mui/icons-material/Clear'

import AgentIcon from '@mui/icons-material/SupportAgent'

import CustomTheme from './customtheme'
//import useAppStore from '../stores/appstore'

import ReactMarkdown from 'react-markdown'

import classes from './contentitem.module.css'

export default function ContentItem({ 
    role = '', 
    content = '', 
    name = '',
    icon = '',
    onDelete = undefined,
}) {

    //const leftRef = React.useRef()
    //const rightRef = React.useRef()

    //const isDarkMode = useAppStore((state) => state.darkMode)

    /*
    const handleSelect = () => {
        if(role === 'user') {

            rightRef.current.focus()

            window.getSelection()
                .selectAllChildren(rightRef.current)
            
            

        } else {

            leftRef.current.focus()

            window.getSelection()
                .selectAllChildren(leftRef.current)
        }
    }
    */

    /*
    <div onClick={handleSelect} className={classes.contentLeft}>
                        <p ref={leftRef}>
                        {
                            content
                        }
                        </p>
                        <div className={classes.delete}>
                            <IconButton size="small" onClick={onDelete}>
                                <ClearIcon sx={{ width: 14, height: 14 }} />
                            </IconButton>
                        </div>
                    </div>*/

    /*
    <div onClick={handleSelect} className={classes.contentRight}>
                        <p ref={rightRef}>
                        {
                            content
                        }
                        </p>
                        <div className={classes.delete}>
                            <IconButton size="small" onClick={onDelete}>
                                <ClearIcon sx={{ width: 14, height: 14 }} />
                            </IconButton>
                        </div>
                    </div>*/

    return (
        <div className={classes.container} 
        style={{
            justifyContent: role === 'user' ? 'flex-end' : 'flex-start'
        }}>
            {
                role !== 'user' &&
                <>
                    <div className={classes.panelLeft}>
                        <div className={classes.logoLeft}>
                            <CustomTheme>
                                <Avatar sx={{ width: 24, height: 24  }}>
                                    <AgentIcon />
                                </Avatar>
                            </CustomTheme>
                        </div>
                    </div>
                    <div className={classes.contentLeft}>
                        <ReactMarkdown>
                        {
                            content
                        }
                        </ReactMarkdown>
                        <div className={classes.delete}>
                            <IconButton size="small" onClick={onDelete}>
                                <ClearIcon sx={{ width: 14, height: 14 }} />
                            </IconButton>
                        </div>
                    </div>
                </>
            }
            {
                role === 'user' &&
                <>
                    <div className={classes.contentRight}>
                        <p>
                        {
                            content
                        }
                        </p>
                        <div className={classes.delete}>
                            <IconButton size="small" onClick={onDelete}>
                                <ClearIcon sx={{ width: 14, height: 14 }} />
                            </IconButton>
                        </div>
                    </div>
                    <div className={classes.logoRight}>
                        <CustomTheme>
                            <Avatar sx={{ width: 24, height: 24  }}>
                                <PersonIcon />
                            </Avatar>
                        </CustomTheme>
                    </div>
                </>
            }
        </div>
    )
}

ContentItem.propTypes = {
    /**
     * Name string
     */
    name: PropTypes.string,
    /**
     * Icon string
     */
    icon: PropTypes.number,
    /**
     * User type
     */
    role: PropTypes.string,
    /**
     * Content data string
     */
    content: PropTypes.string,
    /**
     * Delete click handler
     */
    onDelete: PropTypes.func,
}