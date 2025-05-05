import { GoogleGenerativeAI } from "@google/generative-ai";
import { configDotenv } from 'dotenv';
import { HTTP_STATUS } from "../constants/httpStatus";
import { MESSAGES } from "../constants/messages";

configDotenv();

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY as string);


export async function getGeminiResponse(prompt: string) {

    try {
        const model = genAI.getGenerativeModel({ model: "gemini-2.0-flash" });

        const finalPrompt = `
You are "GreenoBot", a knowledgeable and helpful chatbot embedded in a waste management application.

✅ Your job is to assist users by answering questions related to:
- Waste management
- Recycling and reuse
- Garbage collection and segregation
- Composting (home, community, industrial)
- Plastic segregation and reduction
- E-waste disposal and recycling
- Waste-to-energy technologies
- Sustainable living and waste minimization
- Hygiene and sanitation related to waste
- Environmental impact of waste
- Waste management awareness programs
- Rules, regulations, and policies about waste management
- Statistics, articles, and facts related to waste and recycling

🧹 You should respond:
- In a **clear, helpful, and friendly** tone
- Provide **brief answers** for simple questions
- **Elaborate** with more details, examples, or references when users ask about articles, statistics, or in-depth topics

🚫 If the user asks anything unrelated to the above topics, politely reply:
"I'm here only to assist with waste management, recycling, and environmental sustainability topics. Please ask something relevant."

Now, answer the following question accordingly:
${prompt}

`;

        const result = await model.generateContent(finalPrompt);
        const response = result.response.text();
        return response;
    } catch (err: any) {
        console.log("error :", err.message);
        const error: any = new Error(MESSAGES.UNKNOWN_ERROR);
        error.status = HTTP_STATUS.BAD_GATEWAY;
        throw error;
    }
}

export default getGeminiResponse;
