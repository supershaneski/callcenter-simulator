import { whisper } from '../../services/openai'

import fs from 'fs'
import path from 'path'

export async function POST(request) {
    
    const form = await request.formData()
    const blob = form.get('file')
    const filename = form.get('name')
    
    const buffer = Buffer.from( await blob.arrayBuffer() )
    
    let filepath = `${path.join('public', 'uploads', filename)}`
    fs.writeFileSync(filepath, buffer)

    let text = ''

    try {

        const result = await whisper({
            file: fs.createReadStream(filepath),
        })

        if(result) {
            if(result.hasOwnProperty('text')) { // response_format=json
                text = result.text
            }
        }

    } catch(error) {

        console.log('whisper', error)

    }

    //text = 'Hi, I want to follow up on my order please.'

    return new Response(JSON.stringify({
        text,
    }), {
        status: 200,
    })

}