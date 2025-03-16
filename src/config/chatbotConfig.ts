import { GoogleGenerativeAI } from "@google/generative-ai";
import { configDotenv } from 'dotenv';

configDotenv();

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY as string);


export async function getGeminiResponse(prompt: string) {
    const model = genAI.getGenerativeModel({ model: "gemini-2.0-flash" });

    //     const botIntro = `
    // You are "GreenBot", an AI assistant that only helps users with queries related to:
    // - waste management
    // - recycling
    // - garbage collection
    // - composting
    // - e-waste disposal
    // - plastic segregation

    // If a user asks about anything outside this domain, politely respond with:
    // "I'm here only to assist with waste management and recycling-related topics. Please ask something relevant."

    // Now respond to this question:
    // `;

    // const finalPrompt = `${botIntro} ${prompt}`;


    const finalPrompt = `
You are "GreenoBot", a helpful chatbot embedded in a waste management application. 
Your job is to assist users by answering questions **only related to**:
- waste management
- recycling
- garbage collection
- composting
- plastic segregation
- e-waste disposal

📌 Always respond in a **brief, clear, and concise** format.

🚫 If the user asks anything outside these topics, politely say:
"I'm here only to assist with waste management and recycling-related topics. Please ask something relevant."

Now answer the following question in concise format:
${prompt}
`;


    const result = await model.generateContent(finalPrompt);
    const response = result.response.text();
    return response;
}

export default getGeminiResponse;
