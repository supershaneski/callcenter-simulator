import { chatCompletion } from '../../services/openai'

import { MongoClient } from 'mongodb'

const client = new MongoClient(`mongodb://${process.env.DB_HOST}:${process.env.DB_PORT}/${process.env.DB_NAME}`)

export async function POST(request) {
    
    const { question } = await request.json()

    if (!question) {
        return new Response('Bad question', {
            status: 400,
        })
    }

    let customer_order_number = ''

    try {

        console.log('function call...')

        const messages = [
            { role: "system", content: "When the text contains reference to order number, call get_order function." },
            { role: "user", content: question }
        ]

        const response_test = await chatCompletion({
            max_tokens: 24,
            messages, 
            functions: [
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
            ],
            //function_call: { name: "extract_order_number" } // force
        })

        console.log('function-call', response_test)

        if(response_test.hasOwnProperty('function_call')) {

            const result_test = JSON.parse(response_test.function_call.arguments)
            
            if(result_test.orderno) { // not null
                customer_order_number = result_test.orderno
            }

        }

    } catch(error) {
        console.log(error)
    }

    console.log('order-number', customer_order_number)

    if(!customer_order_number) {

        return new Response(JSON.stringify({
            output: '',
        }), {
            status: 200,
        })

    }

    let result = ''

    try {

        await client.connect()
        
        const db = client.db()

        const items = await db.collection('order').find().toArray()
        
        const order = items.find((item) => item.id === customer_order_number)

        if(order) {

            result = `order-id: ${order.id}\n` +
                `customer-name: ${order.name}\n` +
                `shipping-address: ${order.address}\n` +
                `order-status: ${order?.status || 'Processing'}\n` +
                `expected-delivery-day: ${typeof order.deliveryday === 'undefined' ? 1 : order.deliveryday} day\n` +
                `orders:\n`

            let total = 0
            for(let n in order.items) {
                total += parseInt(order.items[n].quantity) * parseInt(order.items[n].price)
                result += `product: ${order.items[n].name} quantity: ${order.items[n].quantity} unit-price: ¥${order.items[n].price}\n`
            }

            result += `total-price: ¥${total}\n`

        }

        console.log('order result', result)
    
    } catch(error) {

        console.log(error)

    } finally {
        
        await client.close()

    }

    return new Response(JSON.stringify({
        order_number: customer_order_number,
        output: result,
    }), {
        status: 200,
    })

}