callcenter-simulator
======

A sample callcenter simulator using OpenAI technologies such as ChatGPT, Whisper and other APIs to automate and improve callcenter operation. This project is intended to be a sandbox application to test feasibility and other ideas.

---

OpenAIの技術、ChatGPT、WhisperなどのAPIを使用して、コールセンターのオペレーションを自動化および改善するためのサンプルコールセンターシミュレーターを作成しました。このプロジェクトは、実現可能性やその他のアイデアをテストするためのサンドボックスアプリケーションとして構想されています。


# Motivation

The goal of this project is to test the idea of using AI in callcenter operation and if current existing AI products can already replace human agents.

---

このプロジェクトの目的は、AIをコールセンターのオペレーションに使用するアイデアをテストし、既存のAI製品がすでに人間のエージェントを置き換えることができるかどうかを確認することです。


# Development

> This is an ongoing development...

I will need to prepare a backend database to host at least the order items.
This will enable me to be able to easily pull order items if needed.

As for the Data Source, although different document types are possible, at present I only process text files.
You can easily extend this on your own. This is not important for me at the moment so it will take time when I add this function.

Before you do inquiry, please note that you need to add a Data Source first.
And every time you do inquiry, two OpenAPI endpoints are being used: Embeddings and Completion.

Although you can add any text file, to make this effective, you need to format it in such a way that information can easily be parsed.

Sample format:
```
Product List 製品リスト

Category: Sofa ソファー

Name: 2-seater Long Chair 2人掛椅子ロング
Product-Code: ABC0001 / ABC0002 / ABC0003
Price: ¥55000
Variations: Red ABC0001 / Black ABC0002 / White ABC0003
```


## Functions

* Needs local docs as source of truth
* Chat messaging for customer support


## Things to do

* Voice call function
* Needs to provide backend API for data instead of relying on local docs
* Handle orders

# Stack

* [MongoDB](https://github.com/mongodb/node-mongodb-native), official MongoDB driver for Node.js.

    ```
    npm install mongodb
    ```

    For database, we will be using local MongoDB database.
    Since the point of this application is not the database, 
    we will be preparing the database and collections beforehand using [MongoDB Shell](https://www.mongodb.com/docs/mongodb-shell/).

    To run the shell
    ```
    mongodb
    ```

    To add database and collection
    ```js
    use callcenter

    db.order.insertOne({id: 'abc123', name: 'John Doe'})

    db.order.find()
    ```

    To connect to MongoDB in route handler
    ```js
    import { MongoClient } from 'mongodb'
    
    const client = new MongoClient(`mongodb://${process.env.DB_HOST}:${process.env.DB_PORT}/${process.env.DB_NAME}`)

    export async function POST(request) {

        try {

            await client.connect()

            const db = client.db()
            const items = await db.collection('order').find().toArray()

            console.log(items)

        } catch(error) {
            console.log(error)
        } finally {
            await client.close()
        }

        ...
        
        return new Response(result, {
            status: 200,
        })

    }
    ```

    where the environmental variables from `.env`
    ```
    DB_HOST=localhost
    DB_USER=root
    DB_PASS=
    DB_NAME=callcenter
    DB_PORT=27017
    ```

# Setup

Clone the repository and install the dependencies

```sh
git clone https://github.com/supershaneski/callcenter-simulator.git myproject

cd myproject

npm install
```

Copy `.env.example` and rename it to `.env` then edit the `OPENAI_APIKEY` and use your own `OpenAI API key`.

```javascript
OPENAI_APIKEY=YOUR_OWN_API_KEY
```

Then to run the app

```sh
npm run dev
```

Open your browser to `http://localhost:3005/` to load the application page.
