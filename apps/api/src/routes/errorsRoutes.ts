// src/routes/errorRoutes.ts
import { Router } from 'express';
import * as genAi from '../controllers/errorsAIController';
import { verifyToken } from '../auth/verifyToken';

const routes = Router();

// Natural language query endpoint
routes.post(
    '/gen-ai',
    verifyToken, // Authentication middleware
    genAi.handleErrorQuery
);

// Predefined statistics endpoint
routes.get(
    '/stats',
    verifyToken, // Authentication middleware
    genAi.getErrorStats
);

export default routes;