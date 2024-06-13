import express from 'express';
import * as group from '../controllers/groupController';

const routes = express.Router();

routes.post('/get', group.getGroups);
routes.post('/', group.addGroup);
routes.put('/:id', group.updateGroup);
routes.delete('/:id', group.deleteGroup);


export default routes;
