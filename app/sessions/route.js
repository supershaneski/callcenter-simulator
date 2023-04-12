import { MongoClient } from 'mongodb'

const client = new MongoClient(`mongodb://${process.env.DB_HOST}:${process.env.DB_PORT}/${process.env.DB_NAME}`)

export async function GET(request) {

    let items = []

    try {

        await client.connect()
        
        const db = client.db()

        items = await db.collection('session').find().toArray()
        
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
    
    const { session } = await request.json()

    try {

        await client.connect()
        
        const db = client.db()

        const retval = await db.collection('session').insertOne({...session})
        //console.log(retval)

    } finally {
        
        await client.close()

    }

    return new Response(JSON.stringify({
        message: 'Add successful',
    }), {
        status: 200,
    })
}