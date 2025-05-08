import { Router } from 'express';
import * as genAi from '../controllers/lightHouseController';
import { verifyToken } from '../auth/verifyToken';

const routes = Router();

routes.post(
    '/query',
    verifyToken,
    genAi.handleUserQuery
);

export default routes;