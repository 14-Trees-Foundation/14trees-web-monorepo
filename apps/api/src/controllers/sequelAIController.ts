import { Request, Response } from "express";
import { query14TreesAgent } from '../services/genai/agents/14trees/sequel_agent'
import { status } from "../helpers/status";
import { AIMessage, HumanMessage } from "@langchain/core/messages";
import { generateRequestId } from '../services/genai/agents/14trees/sequel_agent';

export const handle14TreesQuery = async (req: Request, res: Response) => {
    try {
        const { message, history, request_id } = req.body;

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

        // Use provided request_id or generate new one
        const requestId = request_id || generateRequestId();

        // Process the query with 14trees agent
        const { output, success, requestId: responseRequestId } = await query14TreesAgent(
            message, 
            messageHistory,
            requestId
        );

        return res.status(status.success).send({
            success,
            output,
            request_id: responseRequestId,
            ...(process.env.NODE_ENV === 'development' && {
                debug: {
                    input: message,
                    history_length: messageHistory.length,
                    request_id: responseRequestId
                }
            })
        });
    } catch (error: any) {
        console.error("Error in handle14TreesQuery:", error);
        return res.status(status.error).send({
            success: false,
            message: "An error occurred while processing your tree planting query.",
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
interface TreesQueryRequest {
    message: string;
    history?: Array<{
        sender: 'user' | 'ai';
        text: string;
    }>;
    request_id?: string;
}

interface TreesQueryResponse {
    success: boolean;
    output: string;
    request_id: string;
    message?: string;
    debug?: {
        input: string;
        history_length: number;
        request_id: string;
    };
    error?: {
        message: string;
        stack?: string;
    };
}

export type { TreesQueryRequest, TreesQueryResponse };