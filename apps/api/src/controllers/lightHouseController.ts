import { Request, Response } from "express";
import { interactLightHouseAgent } from '../services/genai/agents/light_house/light_house';
import { status } from "../helpers/status";
import { AIMessage, HumanMessage } from "@langchain/core/messages";

export const handleUserQuery = async (req: Request, res: Response) => {
    try {
        const { message, history } = req.body;
        
        // Validate required fields
        if (!message) {
            return res.status(status.bad).send({
                message: "The 'message' field is required in the request body."
            });
        }

        // Convert chat history to Langchain messages
        const messageHistory = !Array.isArray(history) 
            ? []
            : history.map(it => {
                return it.sender === 'user' 
                    ? new HumanMessage(it.text) 
                    : new AIMessage(it.text);
            });

        // Process the query with supplier agent
        const response = await interactLightHouseAgent(message, messageHistory);

        return res.status(status.success).send({
            output: response,
        });
    } catch (error: any) {
        console.error("Error in handleSupplierQuery:", error);
        return res.status(status.error).send({
            message: "An error occurred while processing your supplier request.",
            error: process.env.NODE_ENV === 'development' ? error.message : undefined
        });
    }
}
