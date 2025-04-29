import { Router } from 'express';
import { handleSupplierQuery } from "../controllers/SupplierAIController";
import { verifyToken } from '../auth/verifyToken';

const routes = Router();

// Supplier AI Chatbot endpoint
routes.post(
    'supplier/gen-ai',
    verifyToken, // Authentication middleware
    handleSupplierQuery
);

export default routes;