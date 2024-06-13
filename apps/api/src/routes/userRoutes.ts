import { Router } from 'express';
import * as users from '../controllers/usersController';
import uploadFiles from "../helpers/multer";

const routes = Router();

routes.get('/', users.getUser);
routes.post('/get', users.getUsers);
routes.get('/:search', users.searchUsers);
routes.post('/', users.addUser);
routes.post('/bulk', uploadFiles.single('file'),users.addUsersBulk);
routes.put('/:id', users.updateUser);
routes.delete('/:id', users.deleteUser);

export default routes;