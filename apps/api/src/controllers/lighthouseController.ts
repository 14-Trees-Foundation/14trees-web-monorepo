import { Request, Response } from "express";
import { interactWithUnifiedAgent } from '../services/genai/agents/lighthouse/web_agent';
import { status } from "../helpers/status";
import { AIMessage, HumanMessage, BaseMessage } from "@langchain/core/messages";
import { BuyerRepository } from '../repo/buyersRepo';
import { SupplierRepository } from '../repo/suppliersRepo';

// Unified query handler for all agent interactions
export const handleAgentQuery = async (req: Request, res: Response) => {
    try {
        const { message, history } = req.body;
        
        if (!message) {
            return res.status(status.bad).json({
                status: "error",
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

        // Process query with unified agent
        const startTime = Date.now();
        const { output, success } = await interactWithUnifiedAgent(message, messageHistory);
        const processingTime = Date.now() - startTime;

        // Format response based on query type
        if (message.toLowerCase().includes('error') || message.toLowerCase().includes('log')) {
            // Error analysis response format
            return res.status(status.success).json({
                status: "success",
                data: output,
                processingTime: `${processingTime}ms`,
                metadata: {
                    source: "LightHouse errors table",
                    recordCount: typeof output === 'string' ? output.match(/\d+(?=\s*error)/i)?.[0] : undefined
                }
            });
        } else {
            // Standard buyer/supplier response format
            return res.status(status.success).json({
                output,
                processingTime: `${processingTime}ms`
            });
        }
    } catch (error) {
        console.error("Error in handleAgentQuery:", error);
        return res.status(status.error).json({
            status: "error",
            message: "An error occurred while processing your request.",
            ...(process.env.NODE_ENV === 'development' && {
                error: error.message,
                stack: error.stack
            })
        });
    }
}

// Direct CRUD operations (kept separate from agent interactions)
export const updateBuyer = async (req: Request, res: Response) => {
    try {
        const { code } = req.params;
        const updateData = req.body;

        if (!code) {
            return res.status(status.bad).json({
                message: "Buyer code is required as a path parameter."
            });
        }

        const updatedBuyer = await BuyerRepository.updateBuyer(code, updateData);
        return res.status(status.success).json({ buyer: updatedBuyer });
    } catch (error) {
        console.error("Error in updateBuyer:", error);
        return res.status(status.error).json({
            message: "Failed to update buyer details.",
            error: process.env.NODE_ENV === 'development' ? error.message : undefined
        });
    }
}

export const updateSupplier = async (req: Request, res: Response) => {
    try {
        const { code } = req.params;
        const updateData = req.body;

        if (!code) {
            return res.status(status.bad).json({
                message: "Supplier code is required as a path parameter."
            });
        }

        const updatedSupplier = await SupplierRepository.updateSupplier(code, updateData);
        return res.status(status.success).json({ supplier: updatedSupplier });
    } catch (error) {
        console.error("Error in updateSupplier:", error);
        return res.status(status.error).json({
            message: "Failed to update supplier details.",
            error: process.env.NODE_ENV === 'development' ? error.message : undefined
        });
    }
}

export const getEntityDetails = async (req: Request, res: Response) => {
    try {
        const { code, type } = req.params;
        
        if (!code || !type) {
            return res.status(status.bad).json({
                message: "Both entity code and type (buyer/supplier) are required."
            });
        }

        const query = type === 'buyer' 
            ? `Get buyer details for code ${code}`
            : `Get supplier details for code ${code}`;

        const { output } = await interactWithUnifiedAgent(query, []);
        const result = typeof output === 'string' ? JSON.parse(output) : output;

        return res.status(status.success).json({
            [type]: result
        });
    } catch (error) {
        console.error("Error in getEntityDetails:", error);
        return res.status(status.error).json({
            message: `Failed to fetch ${req.params.type} details.`,
            error: process.env.NODE_ENV === 'development' ? error.message : undefined
        });
    }
}