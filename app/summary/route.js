import { chatCompletion } from "../../services/openai"

export async function POST(request) {
    
    const { contents, rating, language } = await request.json()
    
    if (!contents) {
        return new Response('Bad question', {
            status: 400,
        })
    }

    const rate = typeof rating !== 'undefined' ? parseInt(rating) : 0

    const lang = typeof language !== 'undefined' ? parseInt(language) : 0
    
    let system_prompt = ''
    let messages = []

    let inquiry_type = 0 // e.g. 0 - other, 1 - order, 2 - product

    try {

        /*
        const functions = [
            {
                name: "get_inquiry_type",
                description: "Get the inquiry type based on the given conversation.",
                parameters: {
                    type: "object",
                    properties: {
                        inquiry: {
                            type: "string",
                            description: 'If the topic is about order, set order-inquiry; if the user inquires about products, set product-inquiry; otherwise, set other-inquiry.',
                            enum: ["product-inquiry", "order-inquiry", "other-inquiry"]
                        }
                    },
                    required: ["inquiry"]
                }
            }
        ]
        */

        const functions = [
            {
                name: "get_inquiry_type",
                description: "Get the user inquiry type based on the given conversation.",
                parameters: {
                    type: "object",
                    properties: {
                        inquiry_type: {
                            type: "string",
                            description: 'This categorize incoming messages into one of three possible types: "order-inquiry," "product-inquiry," or "other-inquiry". "order-inquiry" should be assigned when the user inquiry relates explicitly to their order status, order tracking, delivery, payment, or any other order related queries. "product-inquiry" should be assigned when the user inquiry is related to product details, product availability, pricing, specifications, or any other product-specific questions. For other inquiries that does not fall from previous categories of order or product, set "other-inquiry".',
                            enum: [ "other-inquiry", "order-inquiry", "product-inquiry" ]
                        }
                    },
                    required: ["inquiry"]
                }
            }
        ]

        system_prompt = `Evaluate the following conversation session between a customer support agent and a customer.\n` +
            `Call the function get_inquiry_type to determine what kind of inquiry this conversation is about.\n`

        messages = [
            { role: 'system', content: system_prompt },
            { role: 'user', content: `Session:\n${contents}` }
        ]

        const func_response = await chatCompletion({
            temperature: 0.7,
            messages,
            functions,
            function_call: { name: 'get_inquiry_type' }
        })

        console.log("function-calling", func_response)

        if(func_response.function_call) {
            const args = JSON.parse(func_response.function_call.arguments)
            if(args.hasOwnProperty('inquiry_type')) {
                inquiry_type = args.inquiry_type === 'order-inquiry' ? 1 : args.inquiry_type === 'product-inquiry' ? 2 : 0
            }
        }

    } catch(error) {
        console.log(error)
    }

    let text = ''

    try {
        
        system_prompt = `Evaluate the following conversations between a customer support agent and a customer.\n` +
            `Provide analysis and make suggestion if necessary.\n`

        if(lang > 0) system_prompt += `Please write the reply in Japanese.\n`

        messages = [
            { role: 'system', content: system_prompt },
        ]

        messages.push({ role: 'user', content: `Customer Rating: ${rate}\n${contents}` })

        const response = await chatCompletion({
            temperature: 0.7,
            messages,
        })

        text = response.content

    } catch(err) {
        console.log(err)
    }

    return new Response(JSON.stringify({
        text,
        inquiry_type,
    }), {
        status: 200,
    })

}