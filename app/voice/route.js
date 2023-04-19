import { embedding, whisper } from '../../services/openai'

import { MAX_FILES_LENGTH, COSINE_SIM_THRESHOLD } from '../../lib/utils'

import fs from 'fs'
import path from 'path'

export async function POST(request) {
    
    const form = await request.formData()
    const blob = form.get('file')
    const filename = form.get('name')
    const files = form.get('files')
    const inquiry = form.get('inquiry')
    const lang = form.get('language')
    
    const inquiry_type = typeof inquiry !== 'undefined' ? parseInt(inquiry) : 0
    const language = typeof lang !== 'undefined' ? parseInt(lang) : 0

    const buffer = Buffer.from( await blob.arrayBuffer() )
    
    //let filepath = `${path.join('public', 'uploads', filename)}`
    
    //fs.writeFileSync(filepath, buffer)

    /*
    const forcedFlag = true // for test
    if(forcedFlag) {
        
        return new Response(JSON.stringify({
            question: 'Yeah, I want to ask if you have any bathtubs.',
            text: 'I am sorry, we do not have any bathtubs.',
        }), {
            status: 200,
        })

    }
    */

    let question = ''

    try {

        const result = await whisper({
            file: buffer,
        })

        question = result.text

    } catch(error) {
        console.log('whisper', error)
    }

    if(question.length === 0) {

        return new Response(JSON.stringify({
            text: question,
        }), {
            status: 200,
        })

    }

    const maxResults = 10

    let fileChunks = []

    try {

        const searchQueryEmbeddingResponse = await embedding({
            input: question,
        })

        const searchQueryEmbedding = searchQueryEmbeddingResponse.length > 0 ? searchQueryEmbeddingResponse[0] : []
        
        fileChunks = files.flatMap((file) =>
            file.chunks
            ? file.chunks.map((chunk) => {
                const dotProduct = chunk.embedding.reduce(
                    (sum, val, i) => sum + val * searchQueryEmbedding[i],
                    0
                )
                return { ...chunk, filename: file.name, score: dotProduct }
            }) : []
        ).sort((a, b) => b.score - a.score).filter((chunk) => chunk.score > COSINE_SIM_THRESHOLD).slice(0, maxResults)
        
    } catch(error) {
        console.log('embeddings', error)
    }

    const filesString = fileChunks
        .map((fileChunk) => `###\n\"${fileChunk.filename}\"\n${fileChunk.text}`)
        .join("\n")
        .slice(0, MAX_FILES_LENGTH)

    let system_prompt = `You are a helpful customer support agent. Try to answer the question from the user using the content of the file extracts below, and if you cannot answer, or find a relevant file, just say so.\n` +
        `If the answer is not contained in the files or if there are no file extracts, respond that you couldn't find the answer to that question.\n`
    
    if(inquiry_type === 1) { // order
        system_prompt += `The user has selected to inquire about their order.\n` +
            `If Order-Data exists, use the customer-name to refer to the user in the response to make it more personal.\n`
    } else if(inquiry_type === 2) {
        system_prompt += `The user has selected to inquire about a product.\n`
    }

    if(language > 0) {
        system_prompt += `Please write the reply in Japanese.\n`
    }

    system_prompt += `You will also check the user's sentiment and include it in the response.\n` +
        `The format of your response should be like this:\n\n` +
        `Customer-Sentiment: neutral\n` +
        `Response:  thank you for contacting us.\n\n` +
        `When the customer have concluded the session, append 'SESSION-ENDED' in the last line of your final response.\n\n` +
        `Files:\n${filesString}\n\n`
    
    let text = ''

    try {

        let messages = [
            { role: 'system', content: system_prompt },
        ]

        messages.push({ role: 'user', content: question })

        text = await chatCompletion({
            messages,
        })

    } catch(error) {
        console.log('chat', error)
    }
    
    return new Response(JSON.stringify({
        question,
        text,
    }), {
        status: 200,
    })

}