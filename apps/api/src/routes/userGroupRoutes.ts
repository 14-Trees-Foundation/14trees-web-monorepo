import express from 'express';
import * as userGroup from '../controllers/userGroupController';

const routes = express.Router();

routes.get('/', userGroup.getUserGroups);
routes.post('/', userGroup.addUserGroup);
// routes.put('/:id', userGroup.updateUserGroup);
routes.delete('/:user_id/:group_id', userGroup.deleteUserGroup);


export default routes;
