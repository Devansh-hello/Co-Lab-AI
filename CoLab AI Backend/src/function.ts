import OpenAI from "openai";

const model = new OpenAI({
    apiKey: "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",
    baseURL : "https://openrouter.ai/api/v1",
});


export async function chat(input:string){
    try{
        const response = await model.chat.completions.create({
            model: "openrouter/sonoma-dusk-alpha",
            messages: [{
                role:"system", 
                content: "Generate code and list create documentation"
            },{
                role:"user",
                content: input
            }],
        });

        const data = response.choices?.[0]?.message?.content??  "";
        return data
    }
    catch(error){
        return error;
    }
    

}
