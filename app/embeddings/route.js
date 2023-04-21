import { embedding } from '../../services/openai'

import { COSINE_SIM_THRESHOLD } from '../../lib/utils'

export async function POST(request) {

    const { files, question, maxResults } = await request.json()
    
    if (!question) {
        return new Response('Bad question', {
            status: 400,
        })
    }
  
    if (!Array.isArray(files) || files.length === 0) {
        return new Response('Bad files', {
            status: 400,
        })
    }
  
    if (!maxResults || maxResults < 1) {
        return new Response('maxResults must be at least one', {
            status: 400,
        })
    }

    try {
        
        const searchQueryEmbeddingResponse = await embedding({
            input: question,
        })
    
        const searchQueryEmbedding = searchQueryEmbeddingResponse.length > 0 ? searchQueryEmbeddingResponse[0] : []
        
        const rankedChunks = files.flatMap((file) =>
            file.chunks
            ? file.chunks.map((chunk) => {
                const dotProduct = chunk.embedding.reduce(
                    (sum, val, i) => sum + val * searchQueryEmbedding[i],
                    0
                );
                return { ...chunk, filename: file.name, score: dotProduct };
            }) : []
        ).sort((a, b) => b.score - a.score).filter((chunk) => chunk.score > COSINE_SIM_THRESHOLD).slice(0, maxResults);
        
        return new Response(JSON.stringify({
            searchResults: rankedChunks,
        }), {
            status: 200,
        })

    } catch(error) {

        console.log(error)

        return new Response('Oops, something went wrong', {
            status: 500,
        })

    }

}