import { Request, Response } from "express"
import { interactWithGiftingAgent } from "../services/genai/agent";
import { status } from "../helpers/status";
import { AIMessage, HumanMessage } from "@langchain/core/messages";


export const serveUserQuery = async (req: Request, res: Response) => {

    const { message, history } = req.body;
    const messageHistory = !Array.isArray(history) 
        ? []
        : history.map(it => {
            return it.sender === 'user' ? new HumanMessage(it.text) : new AIMessage(it.text);
        });

    const resp = await interactWithGiftingAgent(message, messageHistory);

    res.status(status.success).send({
        output: resp,
    })
}