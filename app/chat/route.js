import { chatCompletion } from "../../services/openai"

import { MAX_FILES_LENGTH } from '../../lib/utils'

const getOrderId = (s) => {
    const tokens = s.split('\n')
    let order_id = ''
    for(let i = 0; i < tokens.length; i++) {
        if(tokens[i].indexOf('order-id:') >= 0) {
            let n = tokens[i].indexOf('order-id:')
            order_id = tokens[i].substr(n + 9).trim()
            break
        }
    }
    return order_id
}

export async function POST(request) {
    
    const { fileChunks, previous, question, inquiry, orderData, orderFlag } = await request.json()

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
    
    //const inquiry_type = typeof inquiry !== 'undefined' ? parseInt(inquiry) : 0

    let filesString = fileChunks
        .map((fileChunk) => `###\n\"${fileChunk.filename}\"\n${fileChunk.text}`)
        .join("\n")
        .slice(0, MAX_FILES_LENGTH)
    
    console.log("files-string", filesString.length)
    console.log("order-flag", orderFlag)

    let text = ''

    try {
        
        let system_prompt = `You are a helpful customer support agent.\n` +
            `Try to answer the question from the user using the content of the FILES extract below, and if you cannot answer, or find a relevant file, just say so.\n` +
            `If the answer is not contained in the FILES or if there are no FILES extract, respond that you couldn't find the answer to that question.\n`
        
        /*
        if(inquiry_type === 1) { // order
            system_prompt += `The user has selected to inquire about their order.\n` +
                `If Order-Data exists, use the customer-name to refer to the user in the response to make it more personal.\n`
        } else if(inquiry_type === 2) {
            system_prompt += `The user has selected to inquire about a product.\n`
        }
        */
        
        system_prompt += `You will assist the customer on their inquiries whether it will be about their order, about particular product or service, and any other related inquiries.\n`

        system_prompt += `You will also check the user's sentiment and include it in the response.\n` +
            `The format of your response should be like this:\n\n` +
            `Customer-Sentiment: neutral\n` +
            `Response:  thank you for contacting us.\n\n` +
            `When the customer have concluded the session, append 'SESSION-ENDED' in the last line of your final response.\n\n`
            //`Files:\n${filesString}\n\n`
        
        if(filesString.length > 0) {
            system_prompt += `FILES:\n${filesString}\n\n`
        } else {
            system_prompt += `FILES:\n\n`
        }
        
        if(orderData && !orderFlag) {
            system_prompt += `Order-Data:\n` + orderData + `\n\n`
        }

        let messages = [
            { role: 'system', content: system_prompt },
        ]

        messages = messages.concat(previous)
        messages.push({ role: 'user', content: question })

        console.log('order-data', orderData)
        
        let options = {
            temperature: 0.7
        }

        if(orderData && orderFlag) {

            let order_id = getOrderId(orderData)

            messages.push({ role: 'assistant', content: null, function_call: { name: 'get_order', arguments: `{\n  "orderno": "${order_id}"\n}` }})
            messages.push({ role: 'function', name: 'get_order', content: JSON.stringify({ order: orderData }) })

            options.messages = messages

            options.functions = [
                {
                    name: "get_order",
                    description: "Get user order using order number",
                    parameters: {
                        type: "object",
                        properties: {
                            orderno: {
                                type: "string",
                                description: "Order number, e.g. null, abcde12345"
                            }
                        },
                        required: ["orderno"]
                    }
                }
            ]

        } else {

            options.messages = messages

        }

        const response = await chatCompletion(options)

        text = response.content

        console.log('summary', response)

    } catch(error) {
        console.log(error)
    }

    return new Response(JSON.stringify({
        text,
    }), {
        status: 200,
    })

}