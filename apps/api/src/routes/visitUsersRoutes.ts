import express from 'express';
import * as visitUsers from '../controllers/visitUsersController';
import uploadFiles from "../helpers/multer";




const routes = express.Router();

routes.get('/', visitUsers.getVisitUsers);
routes.post('/', visitUsers.addVisitUsers);
routes.post('/bulk', uploadFiles.single('file'), visitUsers.addVisitUsersBulk);
routes.delete('/', visitUsers.deleteVisitUsers);


export default routes;
