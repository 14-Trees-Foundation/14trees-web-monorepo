import express from 'express';
import * as userGroup from '../controllers/userGroupController';
import uploadFiles from "../helpers/multer";

const routes = express.Router();

routes.get('/', userGroup.getUserGroup);
routes.post('/', userGroup.addUserGroup);
routes.post('/bulk', uploadFiles.single('file'), userGroup.addUserGroup);
routes.delete('/:user_id/:group_id', userGroup.deleteUserGroup);

export default routes;
