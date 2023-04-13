import { whisper } from '../../services/openai'

//import ffmpeg from 'ffmpeg-static'
//import { spawn } from 'child_process'

import fs from 'fs'
import path from 'path'

import axios from 'axios'
import FormData from 'form-data'

export async function POST(request) {
    
    console.log('[voice-call]', (new Date()).toLocaleTimeString())

    /*
    const file1 = 'file1668651180658.m4a'
    const file2 = 'file1668651180658.mp3'

    const filename1 = `${path.join('public', 'uploads', file1)}`
    const filename2 = `${path.join('/public', 'uploads', file2)}`

    if(fs.existsSync(filename1)) {
        console.log("filename1", filename1, "exist")
    }

    console.log(filename1, filename2)

    let result = await new Promise((resolve, reject) => {

        const ffmpegProcess = spawn(ffmpeg, ['-i', filename1, filename2])

        ffmpegProcess.on('error', (err) => {
            console.error('An error occurred: ' + err.message)
            reject(err)
        });

        ffmpegProcess.on('close', (code) => {
            if (code !== 0) {
                console.error('FFmpeg process exited with code ' + code)
                reject('Some error ' + code)
            } else {
                console.log('Conversion complete')
                resolve({
                    output: 'Successful!',
                })
            }
        })

    })

    console.log('[result]', result)
    */

    try {

        const name = 'file1668651180658.mp3' //'file20230413153050.mp3' //'file20230413152612.mp3' //'file167841345035841226.m4a'

        const filename = `${path.join('public', 'uploads', name)}`
        //const stream = fs.createReadStream(filename)

        //const stats = fs.statSync(filename)
        //console.log(stats)

        //const resp = await whisper(stream)
        //console.log('resp', resp)

        let header = {
            'Content-Type': 'multipart/form-data',
            //'Accept': 'application/json',
            'Authorization': `Bearer ${process.env.OPENAI_APIKEY}`
        }
    
        let formData = new FormData()
        formData.append('file', fs.createReadStream(filename), { filename: name })
        formData.append('model', 'whisper-1')
        formData.append('response_format', 'vtt')
        formData.append('temperature', 0.2)
        formData.append('language', 'en')
        
        const url = 'https://api.openai.com/v1/audio/transcriptions'
        
        let result = await new Promise((resolve, reject) => {

            axios.post(url, formData, {
                headers: {
                    ...header,
                }
            }).then((response) => {
                
                resolve({
                    output: response.data,
                })

            }).catch((error) => {
                
                reject(error) // Maybe rather than sending the whole error message, set some status value

            })

        })
        
        console.log(result)
        

    } catch(error) {
        console.log(error)
    }

    return new Response(JSON.stringify({
        output: 'Lorem ipsum dolor amet',
        iat: Date.now(),
    }), {
        status: 200,
    })

}