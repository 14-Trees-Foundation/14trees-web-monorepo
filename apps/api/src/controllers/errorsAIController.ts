// src/controllers/error-query.controller.ts
import { Request, Response } from "express";
import { analyzeErrorsAgent } from '../services/genai/agents/lighthouse/web_errors';
import { status } from "../helpers/status";
import { AIMessage, HumanMessage } from "@langchain/core/messages";

export const handleErrorQuery = async (req: Request, res: Response) => {
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

        return res.status(status.success).json({
            status: "success",
            data: response.formattedOutput,
            processingTime: `${processingTime}ms`,
            metadata: {
                source: "LightHouse errors table",
                recordCount: typeof response.formattedOutput === 'string' 
                    ? response.formattedOutput.match(/row(s)?/gi)?.[0] 
                    : undefined
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
}

export const getErrorStats = async (req: Request, res: Response) => {
    try {
        const { period = '24h' } = req.query;
        
        // Predefined statistical queries
        const statsQuery = `Provide statistics for errors in the last ${period} including:
                           - Total count
                           - Count by severity
                           - Most common error modules
                           - Recent critical errors`;
        
        const response = await analyzeErrorsAgent(statsQuery);

        return res.status(status.success).json({
            status: "success",
            period,
            stats: response.formattedOutput,
            generatedAt: new Date().toISOString()
        });
    } catch (error) {
        console.error("Error in getErrorStats:", error);
        return res.status(status.error).json({
            status: "error",
            message: "Failed to generate error statistics"
        });
    }
}