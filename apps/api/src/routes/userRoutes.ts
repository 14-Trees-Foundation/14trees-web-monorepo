import { Router } from 'express';
import * as users from '../controllers/usersController';
import uploadImages from "../helpers/multer";

const routes = Router();

// @deprecated
routes.post('/add', users.addUser);

routes.get('/', users.getUser);
routes.post('/', users.addUser);
routes.post('/bulk', uploadImages.single('file'),users.addUsersBulk);
routes.put('/:id', users.updateUser);
routes.delete('/:id', users.deleteUser);

export default routes;