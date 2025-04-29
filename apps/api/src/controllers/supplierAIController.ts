import { Request, Response } from "express";
import { interactWithSupplierAgent } from '../services/genai/agents/supplier_agent/web_supplier';
import { status } from "../helpers/status";
import { AIMessage, HumanMessage } from "@langchain/core/messages";
import { SupplierRepository } from '../repo/suppliersRepo';

export const handleSupplierQuery = async (req: Request, res: Response) => {
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
        const response = await interactWithSupplierAgent(message, messageHistory);

        return res.status(status.success).send({
            output: response,
        });
    } catch (error) {
        console.error("Error in handleSupplierQuery:", error);
        return res.status(status.error).send({
            message: "An error occurred while processing your supplier request.",
            error: process.env.NODE_ENV === 'development' ? error.message : undefined
        });
    }
}

// New function to update supplier data
export const updateSupplier = async (req: Request, res: Response) => {
    try {
        const { code } = req.params;
        const updateData = req.body;

        // Validate required fields
        if (!code) {
            return res.status(status.bad).send({
                message: "Supplier code is required as a path parameter."
            });
        }

        // Call the repository method to update the supplier
        const updatedSupplier = await SupplierRepository.updateSupplier(code, updateData);

        return res.status(status.success).send({
            supplier: updatedSupplier,
        });
    } catch (error) {
        console.error("Error in updateSupplier:", error);
        return res.status(status.error).send({
            message: "Failed to update supplier details.",
            error: process.env.NODE_ENV === 'development' ? error.message : undefined
        });
    }
}

// Additional controller for direct supplier operations if needed
export const getSupplierDetails = async (req: Request, res: Response) => {
    try {
        const { code } = req.params;
        
        if (!code) {
            return res.status(status.bad).send({
                message: "Supplier code is required as a path parameter."
            });
        }

        const response = await interactWithSupplierAgent(
            `Get supplier details for code ${code}`,
            []
        );

        return res.status(status.success).send({
            supplier: typeof response === 'string' ? JSON.parse(response) : response
        });
    } catch (error) {
        console.error("Error in getSupplierDetails:", error);
        return res.status(status.error).send({
            message: "Failed to fetch supplier details.",
            error: process.env.NODE_ENV === 'development' ? error.message : undefined
        });
    }
}