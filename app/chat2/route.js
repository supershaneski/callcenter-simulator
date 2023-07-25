import { chatCompletion, embedding } from "../../services/openai"

import { MongoClient } from 'mongodb'

import { COSINE_SIM_THRESHOLD, MAX_FILES_LENGTH, trim_array } from '../../lib/utils'

const client = new MongoClient(`mongodb://${process.env.DB_HOST}:${process.env.DB_PORT}/${process.env.DB_NAME}`)

const functions = [
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
    },
    {
        name: "get_user_inquiry",
        description: "Get the user inquiry",
        parameters: {
            type: "object",
            properties: {
                inquiry: {
                    type: "string",
                    description: "User inquiry, e.g. product, delivery, order, discount"
                }
            },
            required: ["inquiry"]
        }
    }
]

export async function POST(request) {

    const { files, orderData, fileData, previous, question } = await request.json()
    
    if (!Array.isArray(files) || !Array.isArray(previous) || !question) {
        return new Response('Bad request', {
            status: 400,
        })
    }
    
    let prev_data = trim_array(previous, 20)

    let customer_order_number = ''
    let order_data = orderData
    let flag_function_call = false
    let files_string = fileData
    let result = {}
    let messages = []
    let text = ''

    /*const forced_flag = true
    if(forced_flag) {
        return new Response(JSON.stringify({
            text: 'Lorem ipsum dolor quezo de bola con camote de patola. Mekeni tocino de longaniza bahama mama coco banana.',
        }), {
            status: 200,
        })
    }*/

    // function calling
    try {

        console.log('function call...')

        messages = [
            { role: "system", content: "When the text contains reference to order number, call get_order function." },
            { role: "user", content: question }
        ]

        result = await chatCompletion({
            max_tokens: 24,
            messages, 
            functions,
            // function_call: { name: "extract_order_number" } // force
        })

        console.log('function-call-response', result)

        if(result.hasOwnProperty('function_call')) {

            const result_obj = JSON.parse(result.function_call.arguments)
            
            if(result_obj.orderno) { // not null
                customer_order_number = result_obj.orderno
            }

        }

    } catch(error) {
        console.log(error)
    }

    if(customer_order_number) {

        // call database
        try {

            await client.connect()
        
            const db = client.db()

            const items = await db.collection('order').find().toArray()
            
            const order = items.find((item) => item.id === customer_order_number)

            if(order) {

                order_data = `order-id: ${order.id}\n` +
                    `customer-name: ${order.name}\n` +
                    `shipping-address: ${order.address}\n` +
                    `order-status: ${order?.status || 'Processing'}\n` +
                    `expected-delivery-day: ${typeof order.deliveryday === 'undefined' ? 1 : order.deliveryday} day\n` +
                    `orders:\n`

                let total = 0
                for(let n in order.items) {
                    total += parseInt(order.items[n].quantity) * parseInt(order.items[n].price)
                    order_data += `product: ${order.items[n].name} quantity: ${order.items[n].quantity} unit-price: ¥${order.items[n].price}\n`
                }

                order_data += `total-price: ¥${total}\n`

                flag_function_call = true

            }

        } catch(error) {
            console.log(error)
        }

    } else {

        // call embeddings only if there are files of course
        if(files.length > 0) {

            console.log('call embeddings...')

            const maxResults = 10

            try {

                const searchQueryEmbeddingResponse = await embedding({
                    input: question,
                })

                const searchQueryEmbedding = searchQueryEmbeddingResponse.length > 0 ? searchQueryEmbeddingResponse[0] : []
        
                const fileChunks = files.flatMap((file) =>
                    file.chunks
                    ? file.chunks.map((chunk) => {
                        const dotProduct = chunk.embedding.reduce(
                            (sum, val, i) => sum + val * searchQueryEmbedding[i],
                            0
                        );
                        return { ...chunk, filename: file.name, score: dotProduct };
                    }) : []
                ).sort((a, b) => b.score - a.score).filter((chunk) => chunk.score > COSINE_SIM_THRESHOLD).slice(0, maxResults);
                
                files_string = fileChunks
                    .map((fileChunk) => `###\n\"${fileChunk.filename}\"\n${fileChunk.text}`)
                    .join("\n")
                    .slice(0, MAX_FILES_LENGTH)

            } catch(error) {
                console.log(error)
            }

        }

    }

    // call final chat to summarize
    try {

        let system_prompt = `You are a helpful customer support agent.\n` +
            `Try to answer the question from the user using the content of the FILES extract below, and if you cannot answer, or find a relevant file, just say so.\n` +
            `If the answer is not contained in the FILES or if there are no FILES extract, respond that you couldn't find the answer to that question.\n`
            
        system_prompt += `You will assist the customer on their inquiries whether it will be about their order, about particular product or service, and any other related inquiries.\n` +
            `However, do not make up any products or services.\n` +
            `If user inquiry is not in FILES or Order-Data, respond that you could not find the answer.\n`

        system_prompt += `You will also check the user's sentiment and include it in the response.\n` +
            `The format of your response should be like this:\n\n` +
            `Customer-Sentiment: neutral\n` +
            `Response:  thank you for contacting us.\n\n` +
            `When the customer have concluded the session, append 'SESSION-ENDED' in the last line of your final response.\n\n`
            //`Files:\n${filesString}\n\n`
        
        if(files_string.length > 0) {
            system_prompt += `FILES:\n${files_string}\n\n`
        } else {
            system_prompt += `FILES:\n\n`
        }
        
        if(order_data && !flag_function_call) {
            system_prompt += `Order-Data:\n` + orderData + `\n\n`
        }

        messages = [{ role: 'system', content: system_prompt }]
        if(prev_data.length > 0) {
            messages = messages.concat(prev_data)
        }
        messages.push({ role: 'user', content: question })
        
        let options = {
            temperature: 0.7
        }

        console.log('history', prev_data.length)
        console.log('files', files_string.length)
        console.log('order-data', order_data.length)
        console.log('order-flag', flag_function_call)

        if(flag_function_call) {

            messages.push({ role: 'assistant', content: null, function_call: { name: 'get_order', arguments: `{\n  "orderno": "${customer_order_number}"\n}` }})
            messages.push({ role: 'function', name: 'get_order', content: JSON.stringify({ order: order_data }) })

            options.messages = messages

            options.functions = [ functions[0] ]

        } else {

            options.messages = messages

        }

        result = await chatCompletion(options)

        console.log('summary', result)

        text = result.content
        
    } catch(error) {
        console.log(error)
    }

    return new Response(JSON.stringify({
        text,
        orderData: order_data,
        fileData: files_string,
    }), {
        status: 200,
    })
    
}