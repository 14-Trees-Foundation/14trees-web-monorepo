import express from 'express';
import * as group from '../controllers/groupController';
import uploadFiles from "../helpers/multer";

const routes = express.Router();

routes.get('/:search', group.searchGroups);
routes.post('/get', group.getGroups);
routes.post('/', uploadFiles.fields([{name: 'logo', maxCount: 1 }]), group.addGroup);
routes.put('/:id', uploadFiles.fields([{name: 'logo', maxCount: 1 }]), group.updateGroup);
routes.delete('/:id', group.deleteGroup);


export default routes;
