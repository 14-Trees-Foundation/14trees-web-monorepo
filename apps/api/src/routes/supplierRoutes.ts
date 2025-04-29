import { Router } from 'express';
import * as genAi from '../controllers/supplierAIController';
import { verifyToken } from '../auth/verifyToken';

const routes = Router();

// Supplier AI Chatbot endpoint
routes.post(
    '/gen-ai',
    verifyToken, // Authentication middleware
    genAi.handleSupplierQuery
);

// Route to update supplier data
routes.put(
    '/update', 
    verifyToken, // Authentication middleware
    genAi.updateSupplier // Call the update function
);

// Route to get supplier details
routes.get(
    '/get', 
    verifyToken, // Authentication middleware
    genAi.getSupplierDetails // Call the get details function
);

export default routes;