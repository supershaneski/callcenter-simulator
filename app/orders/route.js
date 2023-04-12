import { MongoClient } from 'mongodb'

const client = new MongoClient(`mongodb://${process.env.DB_HOST}:${process.env.DB_PORT}/${process.env.DB_NAME}`)

export async function GET(request) {

    const { searchParams } = new URL(request.url)
    const order_id = searchParams.get('id')
    console.log('search-params', order_id)

    let items = []

    try {

        await client.connect()
        
        const db = client.db()

        const raw_items = await db.collection('order').find().toArray()
        
        if(!order_id) {
            items = raw_items
        } else {
            items = raw_items.filter((item) => item.id === order_id)
        }

    } finally {
        
        await client.close()

    }

    return new Response(JSON.stringify({
        items,
    }), {
        status: 200,
    })

}

export async function POST(request) {
    
    const { order } = await request.json()

    try {

        await client.connect()
        
        const db = client.db()

        const retval = await db.collection('order').insertOne({...order})
        // retval.ops.length > 0
        console.log(retval)

        //const retval = await db.collection('order).deleteOne({ id, payload })
        //retval.deletedCount

        //const retval = await db.collection("order").updateOne({ id }, {$set: neworder });
        //retval.modifiedCount === 0

    } finally {
        
        await client.close()

    }

    return new Response(JSON.stringify({
        message: 'Add successful',
    }), {
        status: 200,
    })
}