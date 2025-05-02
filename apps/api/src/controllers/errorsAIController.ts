// src/controllers/error-query.controller.ts
/*import { Request, Response } from "express";
import { analyzeErrorsAgent } from '../services/genai/agents/lighthouse/web_errors';
import { status } from "../helpers/status";
import { AIMessage, HumanMessage } from "@langchain/core/messages";

export const handleErrorQuery = async (req: Request, res: Response) => {
    console.log('\n=== NEW REQUEST ===');
    console.log('Headers:', req.headers);
    console.log('Body:', JSON.stringify(req.body, null, 2));
    try {
        const { message, history } = req.body;
        
        // Validate required fields
        if (!message || typeof message !== 'string') {
            return res.status(status.bad).json({
                status: "error",
                message: "A text 'message' is required in the request body."
            });
        }

        // Convert chat history to Langchain messages
        const messageHistory = Array.isArray(history) 
            ? history.map(msg => 
                msg.sender === 'user' 
                    ? new HumanMessage(msg.text) 
                    : new AIMessage(msg.text)
            )
            : [];

        // Process the query with error analysis agent
        const startTime = Date.now();
        const response = await analyzeErrorsAgent(message, messageHistory);
        const processingTime = Date.now() - startTime;

        console.log('Agent Response:', {
            query: message,
            response: response.output,
            processingTime: `${processingTime}ms`,
            success: response.success
        });

        return res.status(status.success).json({
            status: "success",
            data: response.output,  // ← Changed from formattedOutput to output
            processingTime: `${processingTime}ms`,
            metadata: {
                source: "LightHouse errors table",
                recordCount: response.output.match(/\d+(?=\s*error)/i)?.[0] || undefined
            }
        });

    } catch (error) {
        console.error("Error in handleErrorQuery:", error);
        return res.status(status.error).json({
            status: "error",
            message: "Failed to analyze error data",
            ...(process.env.NODE_ENV === 'development' && {
                error: error.message,
                stack: error.stack
            })
        });
    }
} */