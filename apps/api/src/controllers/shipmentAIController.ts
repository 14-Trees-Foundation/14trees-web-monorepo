// src/controllers/shipmentAIController.ts
import { Request, Response } from "express";
import { queryShippingData } from '../services/genai/agents/shipment/shipment_agent';
import { status } from "../helpers/status";
import { AIMessage, HumanMessage } from "@langchain/core/messages";

export const handleShippingQuery = async (req: Request, res: Response) => {
    try {
        const { message, history } = req.body;
        
        // Validate required fields
        if (!message) {
            return res.status(status.bad).send({
                success: false,
                message: "The 'message' field is required in the request body."
            });
        }

        // Convert chat history to Langchain messages
        const messageHistory = !Array.isArray(history) 
            ? []
            : history.map(item => {
                return item.sender === 'user' 
                    ? new HumanMessage(item.text) 
                    : new AIMessage(item.text);
            });

        // Process the query with shipping agent
        const { output, success } = await queryShippingData(message, messageHistory);

        return res.status(status.success).send({
            success,
            output,
            ...(process.env.NODE_ENV === 'development' && {
                debug: {
                    input: message,
                    history_length: messageHistory.length
                }
            })
        });
    } catch (error: any) {
        console.error("Error in handleShippingQuery:", error);
        return res.status(status.error).send({
            success: false,
            message: "An error occurred while processing your shipping query.",
            ...(process.env.NODE_ENV === 'development' && {
                error: {
                    message: error.message,
                    stack: error.stack
                }
            })
        });
    }
}

// Type definitions for TypeScript
interface ShippingQueryRequest {
    message: string;
    history?: Array<{
        sender: 'user' | 'ai';
        text: string;
    }>;
}

interface ShippingQueryResponse {
    success: boolean;
    output: string;
    message?: string;
    debug?: {
        input: string;
        history_length: number;
    };
    error?: {
        message: string;
        stack?: string;
    };
}

export type { ShippingQueryRequest, ShippingQueryResponse };