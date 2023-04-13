//import { whisper } from '../../services/openai'

import fs from 'fs'
import path from 'path'

import axios from 'axios'
import FormData from 'form-data'

export async function POST(request) {

    console.log('[voice-call]', (new Date()).toLocaleTimeString())

    try {

        const filename = `${path.join('public', 'uploads', 'file167841345035841226.m4a')}`
        //const stream = fs.createReadStream(filename)

        //const stats = fs.statSync(filename)
        //console.log(stats)

        //const resp = await whisper(stream)

        let header = {
            'Content-Type': 'multipart/form-data',
            'Accept': 'application/json',
            'Authorization': `Bearer ${process.env.OPENAI_APIKEY}`
        }
    
        let formData = new FormData()
        formData.append('file', fs.createReadStream(filename))
        formData.append('model', 'whisper-1')
        
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