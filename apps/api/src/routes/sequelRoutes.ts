import { Router } from 'express';
import * as genAi from '../controllers/sequelAIController';
import { verifyToken } from '../auth/verifyToken';

const routes = Router();

routes.post(
    '/genai',
    verifyToken,
    genAi.handle14TreesQuery
);

export default routes;