import { Router } from 'express';
import * as genAi from '../controllers/shipmentAIController';
import { verifyToken } from '../auth/verifyToken';

const routes = Router();
routes.post(
    '/gen-ai',
    verifyToken,
    genAi.handleShippingQuery
);

export default routes;