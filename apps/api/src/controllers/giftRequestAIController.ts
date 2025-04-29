import { Request, Response } from "express"
import { interactWithGiftingAgent } from "../services/genai/agents/gifting_agents/web_gifting_agent";
import { status } from "../helpers/status";
import { AIMessage, HumanMessage } from "@langchain/core/messages";


export const serveUserQuery = async (req: Request, res: Response) => {

    try {
        const { message, history } = req.body;
        const messageHistory = !Array.isArray(history) 
            ? []
            : history.map(it => {
                return it.sender === 'user' ? new HumanMessage(it.text) : new AIMessage(it.text);
            });

        const resp = await interactWithGiftingAgent(message, messageHistory);

        res.status(status.success).send(resp);
    }
    catch (error) {
        console.error("Error in serveUserQuery:", error);
        res.status(status.error).send({
            message: "An error occurred while processing your request.",
        });
    }
}