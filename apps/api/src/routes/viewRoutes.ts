import express from 'express';
import * as view from '../controllers/viewPermissionsController';
import { verifyToken } from '../auth/verifyToken';

const routes = express.Router();

routes.post('/verify-access', verifyToken, view.verifyUserAccessToView);
routes.get('/', view.getViewByPath);
routes.post('/', view.createNewView);
routes.put('/', view.updateView);
routes.post('/addUsers', view.addViewUsers);
routes.post('/deleteUsers', view.deleteViewUsers);
routes.post('/users', view.updateViewUsers);

export default routes;
