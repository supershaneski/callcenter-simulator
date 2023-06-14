import { chatCompletionFunc } from '../../services/openai'

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

        const messages = [
            { role: "user", content: question }
        ]

        const response_test = await chatCompletionFunc({
            messages, 
            functions: [
                {
                    name: "get_product_order",
                    description: "Get the order details given the order number",
                    parameters: {
                        type: "object",
                        properties: {
                            orderno: {
                                type: "string",
                                description: "The order number, e.g. abc12345, s9001-xaw9287-01"
                            }
                        },
                        required: ["orderno"]
                    }
                }
            ]
        })

        if(response_test.hasOwnProperty('function_call')) {
            const result_test = JSON.parse(response_test.function_call.arguments)
            customer_order_number = result_test.orderno
        }

    } catch(error) {
        console.log(error)
    }

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
    
    } catch(error) {
        console.log(error)
    } finally {
        
        await client.close()

    }

    //console.log('output', result)

    return new Response(JSON.stringify({
        output: result,
    }), {
        status: 200,
    })

}