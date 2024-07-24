import express from 'express';
import * as visitImages from '../controllers/visitImagesController';

const routes = express.Router();

routes.get('/:visit_id', visitImages.getVisitImages);
routes.post('/', visitImages.addVisitImages);


export default routes;
