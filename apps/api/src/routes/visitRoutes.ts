import express from 'express';
import * as visits from '../controllers/visitController';

const routes = express.Router();

routes.post('/get', visits.getVisits);
routes.post('/', visits.addVisit);
routes.put('/:id', visits.updateVisit);
routes.delete('/:id', visits.deleteVisit);


export default routes;
