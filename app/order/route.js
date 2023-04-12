import { textCompletion } from '../../services/openai'

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

        let command_prompt = `Check this inquiry if it contains order number/code.\n` + 
            `If it contains possible order number/code, convert this inquiry to a programmatic command:\n\n` +
            `Example:\n\n` +
            `Inquiry: The order number is 1234-5678-90\n` +
            `Output: find -order-no 1234-5678-90\n\n` +
            `If there is no order number/code:\n\n` +
            `Example:\n\n` +
            `Inquiry: Hello thank you\n` +
            `Output: NO-COMMAND\n\n` +
            `Inquiry: ` + question + `\n`

        let output_str = await textCompletion({
            prompt: command_prompt,
            stop: ['Inquiry:'],
        })

        if(output_str.indexOf('NO-COMMAND') < 0) {
            
            let tokens = output_str.split('find -order-no')
            
            if(tokens.length > 1) {

                customer_order_number = tokens[1].trim()

            }

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

    console.log('output', result)

    return new Response(JSON.stringify({
        output: result,
    }), {
        status: 200,
    })

}