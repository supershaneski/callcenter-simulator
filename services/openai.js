import { Configuration, OpenAIApi } from 'openai'

const configuration = new Configuration({
    apiKey: process.env.OPENAI_API_KEY,
})

const openai = new OpenAIApi(configuration)

export async function embedding({
    model = 'text-embedding-ada-002',
    input,
}) {

    try {

        const result = await openai.createEmbedding({
            model,
            input,
        })
    
        if (!result.data.data[0].embedding) {
            throw new Error("No return error from embedding")
        }
    
        return result.data.data.map((d) => d.embedding)

    } catch(error) {
        console.log(err)
        throw error
    }

}

export async function textCompletion({
    prompt,
    model = 'text-davinci-003',
    max_tokens = 1024,
    temperature = 0,
    stop = '\n'
}) {

    try {

        const result = await openai.createCompletion({
            prompt,
            model,
            max_tokens,
            temperature,
            stop,
        })
        
        if (!result.data.choices[0].text) {
            throw new Error("No return error from completion")
        }

        return result.data.choices[0].text

    } catch(error) {
        console.log(error)
        throw error
    }

}

export async function chatCompletion({
    model = 'gpt-3.5-turbo-0613',
    max_tokens = 1024,
    temperature = 0,
    messages,
    functions,
    function_call = 'auto',
    timeout = 12000, // don't wait too long
}) {

    let options = { model, max_tokens, temperature, messages }

    if(Array.isArray(functions) && functions.length > 0) {
        
        options.functions = functions

        if(function_call) {
            
            options.function_call = function_call

        }

    }

    try {
        
        const result = await openai.createChatCompletion(options, { timeout })

        if (!result.data.choices[0].message) {
            throw new Error("No return error from chat");
        }

        return result.data.choices[0].message

    } catch(error) {

        //console.log(error)

        if(error.response) {
            console.log("[STATUS-1]", error.response.status)
            console.log("[DATA-1]", error.response.data)
        } else {
            console.log("[MESSAGE-1]", error.message)
        }
        
        throw error

    }
}

export async function whisper({
    file,
    model = 'whisper-1',
    format = 'json',
    temperature = 0,
    language = 'en',
}) {

    try {

        const resp = await openai.createTranscription(
            file,
            model,
            '',
            format,
            temperature,
            language,
        )

        return resp?.data

    } catch(error) {
        console.log(error)
        throw error
    }
}