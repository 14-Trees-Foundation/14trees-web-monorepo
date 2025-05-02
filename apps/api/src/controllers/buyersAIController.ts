// src/controllers/buyerController.ts
/*import { Request, Response } from "express";
import { interactWithBuyerAgent } from '../services/genai/agents/lighthouse/web_buyer';
import { status } from "../helpers/status";
import { AIMessage, HumanMessage } from "@langchain/core/messages";
import { BuyerRepository } from '../repo/buyersRepo';

export const handleBuyerQuery = async (req: Request, res: Response) => {
    try {
        const { message, history } = req.body;
        
        // Validate required fields
        if (!message) {
            return res.status(status.bad).json({
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

        // Process the query with buyer agent
        const response = await interactWithBuyerAgent(message, messageHistory);

        return res.status(status.success).json({
            output: response,
        });
    } catch (error) {
        console.error("Error in handleBuyerQuery:", error);
        return res.status(status.error).json({
            message: "An error occurred while processing your buyer request.",
            error: process.env.NODE_ENV === 'development' ? error.message : undefined
        });
    }
}

export const updateBuyer = async (req: Request, res: Response) => {
    try {
        const { code } = req.params;
        const updateData = req.body;

        // Validate required fields
        if (!code) {
            return res.status(status.bad).json({
                message: "Buyer code is required as a path parameter."
            });
        }

        // Call the repository method to update the buyer
        const updatedBuyer = await BuyerRepository.updateBuyer(code, updateData);

        return res.status(status.success).json({
            buyer: updatedBuyer,
        });
    } catch (error) {
        console.error("Error in updateBuyer:", error);
        return res.status(status.error).json({
            message: "Failed to update buyer details.",
            error: process.env.NODE_ENV === 'development' ? error.message : undefined
        });
    }
}

export const getBuyerDetails = async (req: Request, res: Response) => {
    try {
        const { code } = req.params;
        
        if (!code) {
            return res.status(status.bad).json({
                message: "Buyer code is required as a path parameter."
            });
        }

        const response = await interactWithBuyerAgent(
            `Get buyer details for code ${code}`,
            []
        );

        return res.status(status.success).json({
            buyer: typeof response === 'string' ? JSON.parse(response) : response
        });
    } catch (error) {
        console.error("Error in getBuyerDetails:", error);
        return res.status(status.error).json({
            message: "Failed to fetch buyer details.",
            error: process.env.NODE_ENV === 'development' ? error.message : undefined
        });
    }
} */

