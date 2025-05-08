// src/routes/buyerRoutes.ts
import { Router } from 'express';
import * as genAi from '../controllers/buyersAIController';
import { verifyToken } from '../auth/verifyToken';

const routes = Router();


routes.post(
    '/gen-ai',
    verifyToken, // Authentication middleware
    genAi.handleBuyerQuery
);


routes.put(
    '/update', 
    verifyToken, // Authentication middleware
    genAi.updateBuyer // Call the update function
);


routes.get(
    '/get', 
    verifyToken, // Authentication middleware
    genAi.getBuyerDetails // Call the get details function
);

export default routes;