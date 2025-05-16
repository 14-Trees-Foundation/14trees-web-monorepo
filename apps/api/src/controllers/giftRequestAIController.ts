import { Request, Response } from "express"
import { interactWithGiftingAgent } from "../services/genai/agents/gifting_agents/web_gifting_agent";
import { status } from "../helpers/status";
import { AIMessage, HumanMessage } from "@langchain/core/messages";
import { extractStrucutredData } from "../services/genai/agents/gifting_agents/structured_output_llm";
import { generateHtml } from "../services/genai/agents/gifting_agents/html_output";


export const serveUserQuery = async (req: Request, res: Response) => {

    try {
        const { message, history } = req.body;
        const messageHistory = !Array.isArray(history) 
            ? []
            : history.map(it => {
                return it.sender === 'user' ? new HumanMessage(it.text) : new AIMessage(it.text);
            });

        const resp = await interactWithGiftingAgent(message, messageHistory);


        let context = "History: " + JSON.stringify(history);
        context += "\n\nUserInput: " + message;
        context += "\n\n" + resp.context;
        context += "\n\nOutput: " + resp.text_output;

        const data = await extractStrucutredData(context);
        // const html = await generateHtml(data);

        res.status(status.success).send({ text_output: resp.text_output, data });
    }
    catch (error) {
        console.error("Error in serveUserQuery:", error);
        res.status(status.error).send({
            message: "An error occurred while processing your request.",
        });
    }
}