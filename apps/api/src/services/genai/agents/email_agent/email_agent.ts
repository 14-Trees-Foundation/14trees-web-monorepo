import { BaseMessage, HumanMessage } from "@langchain/core/messages";
import app from "./email_agent_v2";
import { traceable } from "langsmith/traceable";

export const interactWithEmailAgent = traceable(async (query: string, history: BaseMessage[], tries: number = 3): Promise<any> => {
    if (tries === 0) {
        return null
    }

    const result = await app.invoke({ messages: [...history, new HumanMessage(query)]})

    try {
        let content = (result.messages[result.messages.length - 1].content) as string;
        content = content.trim();

        // Regular expression to extract JSON content between ```json ``` markers
        const jsonMatch = content.match(/```json([\s\S]*?)```/);
        if (jsonMatch) {
            const jsonString = jsonMatch[1].trim();
            const data = JSON.parse(jsonString);
            if (data?.output?.email_body) return data;
        }
    } catch(error: any) {
        console.log("JSON parse error for", result.messages[result.messages.length - 1].content)
    }

    return await interactWithEmailAgent("Inorder to send response as email, you will need to provid valid JSON output format provided to you in the context", result.messages, --tries);
})