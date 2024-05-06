import { Router } from 'express';
import { addUser, getUser } from '../controllers/usersController';

const routes = Router();

routes.post('/add', addUser);
routes.get('/', getUser);

export default routes;