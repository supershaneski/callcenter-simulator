'use client'

import React from 'react'

import { createPortal } from 'react-dom'
import { compact } from 'lodash'

import LoadingButton from '@mui/lab/LoadingButton'
//import Button from '@mui/material/Button'
import IconButton from '@mui/material/IconButton'
import ClearIcon from '@mui/icons-material/Clear';
import DeleteIcon from '@mui/icons-material/DeleteForever';

//import useFileStore from '../stores/filestore';

import { getDateTime, MAX_NUM_FILES, MAX_FILE_SIZE_MB } from '../lib/utils'

import useCaption from '../lib/usecaption'
import captions from '../assets/settings.json'

import LoadingProgress from './loading'

import classes from './datasource.module.css'
import CustomTheme from './customtheme';

export default function DataSource() {

    const setCaption = useCaption(captions)

    //const files = useFileStore((state) => state.files)
    //const addFile = useFileStore((state) => state.add)

    const fileRef = React.useRef(null)

    const [savedFiles, setSavedFiles] = React.useState([])
    const [errorMessage, setErrorMessage] = React.useState('')
    const [loading, setLoading] = React.useState(false)
    const [selectedFile, setSelectedFile] = React.useState('')
    const [openLoader, setOpenLoader] = React.useState(true)

    React.useEffect(() => {

        getFiles()

    }, [])

    const getFiles = React.useCallback(async () => {

        try {

            const response = await fetch('/files/', {
                method: 'GET',
                headers: {
                    'Content-Type': 'application/json',
                }
            })

            if(!response.ok) {
                console.log('Oops, an error occurred', response.status)
            }

            const { items } = await response.json()

            setSavedFiles(items)

            setOpenLoader(false)

        } catch(error) {

            console.log(error)

            setOpenLoader(false)

        }

    })

    const handleFileChange = React.useCallback(async (files) => {
        
        if (files.length + savedFiles.length > MAX_NUM_FILES) {
            setErrorMessage(setCaption('max-file-error'))
            return;
        }

        setLoading(true)

        const uploadedFiles = await Promise.all(
            Array.from(files).map(async (file) => {

                if (file.type.match(/(text\/plain|text\/rtf|application\/(pdf|msword|vnd\.openxmlformats-officedocument\.wordprocessingml\.document)|text\/(markdown|x-markdown))/) && file.size < MAX_FILE_SIZE_MB * 1024 * 1024) {
                    
                    if (savedFiles.find((f) => f.name === file.name)) {
                        // File already exist
                        return null
                    }

                    const formData = new FormData()
                    formData.append('file', file)
                    
                    try {

                        const response = await fetch('/upload/', {
                            method: 'POST',
                            headers: {
                                'Accept': 'application/json',
                            },
                            body: formData,
                        })

                        if(!response.ok) {
                            console.log("Oops, an error occurred.", response.status)
                        }

                        const result = await response.json()

                        const text = result.text
                        const meanEmbedding = result.meanEmbedding
                        const chunks = result.chunks

                        return {
                            name: file.name,
                            url: URL.createObjectURL(file),
                            datetime: file.lastModified,
                            type: file.type,
                            size: file.size,
                            expanded: false,
                            embedding: meanEmbedding,
                            chunks: chunks,
                            extractedText: text,
                        }

                    } catch(error) {
                        // Embedding error
                        console.log(error)
                        return null
                    }

                } else {
                    // invalid file type/size
                    return null
                }
            })
        )
        
        const validFiles = compact(uploadedFiles);
        
        try {

            const response = await fetch('/files/', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    files: validFiles,
                })
            })

            if(!response.ok) {
                console.log('Oops, an error occurred', response.status)
            }

            const result = await response.json()

            setSavedFiles((prevFiles) => [...prevFiles, ...validFiles])
        
            setLoading(false)
            setErrorMessage('')

            getFiles()

        } catch(error) {

            console.log(error)

        }

    }, [savedFiles])
    
    const handleSelected = (file) => {
        
        const sfile = savedFiles.find((item) => item.name === file)
        
        setSelectedFile(sfile)

    }

    const handleDelete = (file) => async (e) => {

        e.preventDefault()
        e.stopPropagation()

        try {

            const response = await fetch('/files/', {
                method: 'DELETE',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    name: file,
                })
            })

            if(!response.ok) {
                console.log('Oops, an error occurred', response.status)
            }

            const result = await response.json()

            console.log(result)

            getFiles()

        } catch(error) {

            console.log(error)

        }

    }
    
    return (
        <div className={classes.container}>
            <div className={classes.panel}>
                <CustomTheme>
                    <LoadingButton 
                    loading={loading}
                    disabled={savedFiles.length >= MAX_NUM_FILES}
                    disableElevation
                    variant="contained"
                    onClick={() => fileRef.current.click()}
                    >{ setCaption('add-data-source') }</LoadingButton>
                    <input
                    ref={fileRef}
                    type="file"
                    className={classes.hidden}
                    accept=".pdf,.doc,.docx,.rtf,.txt"
                    multiple
                    onChange={(e) => handleFileChange(e.target.files)}
                    />
                </CustomTheme>
                {
                    errorMessage && <span className={classes.error}>{ errorMessage }</span>
                }
            </div>
            <div className={classes.panel}>
                <table className={classes.table}>
                    <thead>
                        <tr>
                            <th>{ setCaption('filename') }</th>
                            <th>{ setCaption('last-modify') }</th>
                            <th>{ setCaption('file-type') }</th>
                            <th>{ setCaption('file-size') }</th>
                            <th>{ setCaption('action') }</th>
                        </tr>
                    </thead>
                    <tbody>
                    {
                        savedFiles.length === 0 &&
                        <tr>
                            <td colSpan={5} className={`${classes.center} ${classes.empty}`}>
                                <span>{ setCaption('no-files') }</span>
                            </td>
                        </tr>
                    }
                    {
                        savedFiles.length > 0 &&
                        savedFiles.map((file) => {
                            
                            const size = Math.round((100 * file.size/1024))/100;

                            const datetime = getDateTime(file.datetime)

                            return (
                                <tr key={ file.name } className={classes.item} onClick={() => handleSelected(file.name)}>
                                    <td><span>{ file.name }</span></td>
                                    <td className={classes.center}>{ datetime }</td>
                                    <td className={classes.center}>{ file.type }</td>
                                    <td className={classes.right}>{ size }</td>
                                    <td className={classes.center}>
                                        <CustomTheme>
                                            <IconButton onClick={handleDelete(file.name)}>
                                                <DeleteIcon color="error" />
                                            </IconButton>
                                        </CustomTheme>
                                    </td>
                                </tr>
                            )
                        })
                    }
                    </tbody>
                </table>
            </div>
            {
                selectedFile &&
                <div className={classes.panel}>
                    <div className={classes.divider}>&nbsp;</div>
                    <div className={classes.toolbar}>
                        <div className={classes.close}>
                            <CustomTheme>
                                <IconButton onClick={() => setSelectedFile(null)}>
                                    <ClearIcon />
                                </IconButton>
                            </CustomTheme>
                        </div>
                    </div>
                    <table className={classes.table}>
                        <tbody>
                            <tr>
                                <td>{ selectedFile.name }</td>
                                <td>{ getDateTime(selectedFile.datetime) }</td>
                                <td>{ Math.round((100 * selectedFile.size/1024))/100 } KiB</td>
                                <td>{ selectedFile.type }</td>
                            </tr>
                            <tr className={classes.item}>
                                <td colSpan={4}>
                                    <div className={classes.data}>
                                        { selectedFile.extractedText }
                                    </div>
                                </td>
                            </tr>
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