import express from 'express';
import { addOrg, getOrg } from '../controllers/orgController';

const routes = express.Router();

routes.post('/add', addOrg);
routes.get('/', getOrg);

export default routes;
