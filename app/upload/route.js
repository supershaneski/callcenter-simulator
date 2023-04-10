import { embedding } from '../../services/openai'

import { chunkText, MAX_CHAR_LENGTH, MAX_BATCH_SIZE } from '../../lib/utils'

export async function POST(req) {

    const form = await req.formData()
    
    const blob = form.get('file')
    
    const buffer = Buffer.from( await blob.arrayBuffer() )

    const text = buffer.toString()

    let maxCharLength = MAX_CHAR_LENGTH
    let batchSize = MAX_BATCH_SIZE

    const textChunks = chunkText({ text, maxCharLength })

    const batches = [];
    for (let i = 0; i < textChunks.length; i += batchSize) {
        batches.push(textChunks.slice(i, i + batchSize));
    }

    let textEmbeddings = []

    try {

        const batchPromises = batches.map((batch) => embedding({ input: batch }))
    
        const embeddings = (await Promise.all(batchPromises)).flat()
    
        textEmbeddings = embeddings.map((embedding, index) => ({
          embedding,
          text: textChunks[index],
        }))

    } catch (error) {

        console.log(error)

        return new Response(JSON.stringify({
            text,
            meanEmbedding: [],
            chunks: []
        }), {
            status: 200,
        })

    }

    // If there are 0 or 1 embeddings, the mean embedding is the same as the embedding
    if (textEmbeddings.length <= 1) {
        
        return new Response(JSON.stringify({
            text,
            meanEmbedding: textEmbeddings[0]?.embedding ?? [],
            chunks: textEmbeddings
        }), {
            status: 200,
        })

    }

    // If there are multiple embeddings, calculate their average
    const embeddingLength = textEmbeddings[0].embedding.length
    const meanEmbedding = []

    for (let i = 0; i < embeddingLength; i++) {
      
        // Sum up the values at the same index of each embedding
        let sum = 0
        for (const textEmbedding of textEmbeddings) {
            sum += textEmbedding.embedding[i]
        }

        // Divide by the number of embeddings to get the mean
        meanEmbedding.push(sum / textEmbeddings.length)

    }

    return new Response(JSON.stringify({
        text,
        meanEmbedding: meanEmbedding,
        chunks: textEmbeddings
    }), {
        status: 200,
    })

}