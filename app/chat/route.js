import { chatCompletion } from "../../services/openai"

import { MAX_FILES_LENGTH } from '../../lib/utils'

export async function POST(request) {
    
    const { fileChunks, previous, question, inquiry, orderData } = await request.json()

    if (!Array.isArray(previous)) {
        return new Response('Bad chunks', {
            status: 400,
        })
    }

    if (!Array.isArray(fileChunks)) {
        return new Response('Bad chunks', {
            status: 400,
        })
    }
    
    if (!question) {
        return new Response('Bad question', {
            status: 400,
        })
    }
    
    const inquiry_type = typeof inquiry !== 'undefined' ? parseInt(inquiry) : 0

    const filesString = fileChunks
        .map((fileChunk) => `###\n\"${fileChunk.filename}\"\n${fileChunk.text}`)
        .join("\n")
        .slice(0, MAX_FILES_LENGTH)
    
    let text = ''

    try {
        
        let system_prompt = `You are a helpful customer support agent. Try to answer the question from the user using the content of the file extracts below, and if you cannot answer, or find a relevant file, just say so.\n` +
            `If the answer is not contained in the files or if there are no file extracts, respond that you couldn't find the answer to that question.\n`
        
        if(inquiry_type === 1) { // order
            system_prompt += `The user has selected to inquire about their order.\n` +
                `If Order-Data exists, use the customer-name to refer to the user in the response to make it more personal.\n`
        } else if(inquiry_type === 2) {
            system_prompt += `The user has selected to inquire about a product.\n`
        }

        system_prompt += `You will also check the user's sentiment and include it in the response.\n` +
            `The format of your response should be like this:\n\n` +
            `Customer-Sentiment: neutral\n` +
            `Response:  thank you for contacting us.\n\n` +
            `When the customer have concluded the session, append 'SESSION-ENDED' in the last line of your final response.\n\n` +
            `Files:\n${filesString}\n\n`
        
        if(orderData) {
            system_prompt += `Order-Data: ` + orderData + `\n\n`
        }

        let messages = [
            { role: 'system', content: system_prompt },
        ]

        messages = messages.concat(previous)
        messages.push({ role: 'user', content: question })

        text = await chatCompletion({
            messages,
        })

    } catch(error) {
        console.log(error)
    }

    return new Response(JSON.stringify({
        text,
    }), {
        status: 200,
    })

}