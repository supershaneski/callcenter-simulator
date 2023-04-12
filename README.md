callcenter-simulator
======

A sample callcenter simulator using OpenAI technologies such as ChatGPT, Whisper and other APIs to automate and improve callcenter operation. This project is intended to be a sandbox application to test feasibility and other ideas.

---

OpenAIの技術、ChatGPT、WhisperなどのAPIを使用して、コールセンターのオペレーションを自動化および改善するためのサンプルコールセンターシミュレーターを作成しました。このプロジェクトは、実現可能性やその他のアイデアをテストするためのサンドボックスアプリケーションとして構想されています。


# Motivation

The goal of this project is to test the idea of using AI in callcenter operation and if current existing AI products can already replace human agents.

---

このプロジェクトの目的は、AIをコールセンターのオペレーションに使用するアイデアをテストし、既存のAI製品がすでに人間のエージェントを置き換えることができるかどうかを確認することです。

> Please note that this is an ongoing development...

# Using Local Files and ChatGPT

Basically, we will be using the embedding pattern:

```
[ Extract text data from files ]

[ Get embeddings for the text data for each file ]

[ Get embeddings for the user question ]

[ Compare the file embeddings with question embedding and get the result ]

[ Attach the result to prompt for ChatGPT ]
```

## Extracting Text Data from Files

In this project, I am only processing text files. To extract text data from text files in the backend:

```javascript
const form = await req.formData()
    
const blob = form.get('file')

const buffer = Buffer.from( await blob.arrayBuffer() )

const text = buffer.toString() // text data
```

You can easily find how to extract text data from other file types in the web.
It is not important for this demo so you need to do it yourself.

For example, for PDF files, install [pdf-parse](https://www.npmjs.com/package/pdf-parse):

```sh
npm install pdf-parse
```

Then in your backend

```javascript
import pdfParse from "pdf-parse"

...

const buffer = await new Promise((resolve, reject) => {
    const fileStream = fs.createReadStream(filepath);
    const chunks: any[] = []
    fileStream.on("data", (chunk) => {
      chunks.push(chunk);
    })
    fileStream.on("error", (error) => {
      reject(error);
    })
    fileStream.on("end", () => {
      resolve(Buffer.concat(chunks))
    })
})

const pdfData = await pdfParse(buffer)

return pdfData.text // text data
```

## Using Embeddings API

To get the embeddings from our text data

```javascript
const { Configuration, OpenAIApi } = require("openai")

const configuration = new Configuration({
  apiKey: process.env.OPENAI_API_KEY,
})

const openai = new OpenAIApi(configuration)

const response = await openai.createEmbedding({
  model: "text-embedding-ada-002",
  input: textData, // the text data we extracted from the files
})
```

Then we save the result in the database for later use.

We will also be getting the embeddings of the user's question itself.
Then using the file embeddings and the question embeddings, we compare it for similarity.

```javascript
const rankedChunks = fileEmbeddings.flatMap((file) =>
    file.chunks
    ? file.chunks.map((chunk) => {
        const dotProduct = chunk.embedding.reduce(
            (sum, val, i) => sum + val * questionEmbedding[i],
            0
        );
        return { ...chunk, filename: file.name, score: dotProduct };
    }) : []
    ).sort((a, b) => b.score - a.score).filter((chunk) => chunk.score > COSINE_SIM_THRESHOLD).slice(0, maxResults)
```

This code is basically just finding the [cosine similarity](https://en.wikipedia.org/wiki/Cosine_similarity).
The result of this is what we attach to the ChatGPT prompt.

## ChatGPT Prompt

Using the embeddings processing result, we will prepare our prompt for ChatGPT

```javascript
let system_prompt = `You are a helpful customer support agent.` +
    `Try to answer the question from the user using the content of the file extracts below, and if you cannot find the answer just say so.\n` +
    `If the answer is not contained in the files or if there are no file extracts, respond that you couldn't find the answer to that question.\n\n` +
    `Files:\n${rankedChunks}\n\n`
```

So from there it is just a matter of using the chat completion API:

```javascript
const { Configuration, OpenAIApi } = require("openai")

const configuration = new Configuration({
  apiKey: process.env.OPENAI_API_KEY,
})

const openai = new OpenAIApi(configuration)

const completion = await openai.createChatCompletion({
  model: "gpt-3.5-turbo",
  messages: [
    {role: "system", content: system_prompt},
    {role: "user", content: question}
],
})

console.log(completion.data.choices[0].message);
```

# API Endpoint

The embeddings pattern from above is only useful for a few files because of the limit in maximum tokens (e.g. 4096 tokens for gtp-3.5-turbo) that we can use in chat completion API.
It is immediately apparent that if we have large data source, we cannot use this.

For real customer support system, we will need database access for product and order information.

We can solve this by putting our data behind a server and providing API endpoints to fetch the data.
If you read the docs, this is basically what ChatGPT Plugin seem to be doing.

In this simulation, the product list, etc. are extracted from files. 
But for user's order, we will be using our backend database.

We add another step in our pattern above:

```
[user submits question]

[extract command from question]

[if command exist, use it to fetch data from API endpoint]

[add the result of API endpoint in ChatGPT]
```

# Data Source

Before you can use the customer support function, you need to add a Data Source.

Currently, I only process text files although you can select other file types in the File dialog.
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

Check `/assets/product.txt` file for sample data source.


# Using MongoDB

I started this project with using just client side storage (e.g. localStorage and indexedDB) but as the development progresses it became clear that I need a backend database.

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

You also need to update the variables for the database
```javascript
DB_HOST=localhost
DB_USER=root
DB_PASS=
DB_NAME=callcenter
DB_PORT=27017
```

Prepare your MongoDB and create the database.

Then run the app

```sh
npm run dev
```

Open your browser to `http://localhost:3005/` to load the application page.

Go to Settings->Data Source and load your text file.

Now, you can use the customer support functions.

