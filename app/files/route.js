import { MongoClient } from 'mongodb'

const client = new MongoClient(`mongodb://${process.env.DB_HOST}:${process.env.DB_PORT}/${process.env.DB_NAME}`)

export async function GET(request) {

    let items = []

    try {

        await client.connect()
        
        const db = client.db()

        items = await db.collection('file').find().toArray()
        
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
    
    const { files } = await request.json()

    try {

        await client.connect()
        
        const db = client.db()

        const retval = await db.collection('file').insertMany([...files])
        console.log(retval)

    } finally {
        
        await client.close()

    }

    return new Response(JSON.stringify({
        message: 'Add successful',
    }), {
        status: 200,
    })
}

export async function DELETE(request) {

    const { name } = await request.json()

    try {

        await client.connect()
        
        const db = client.db()

        const retval = await db.collection('file').deleteOne({ name: name })

        console.log(retval)

    } catch(error) {

        console.log(error)

    }

    return new Response(JSON.stringify({
        message: 'Delete successful',
    }), {
        status: 200,
    })

}