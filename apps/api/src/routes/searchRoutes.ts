import { Router } from 'express';
import * as search from '../controllers/searchController';

const routes = Router();

routes.get('/', search.getAll);

export default routes;
