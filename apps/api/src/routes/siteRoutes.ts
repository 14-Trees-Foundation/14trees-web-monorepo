import express from 'express';
import * as sites from '../controllers/siteController';

const routes = express.Router();

routes.get('/', sites.getSites);
routes.post('/', sites.addSite);
routes.put('/:id', sites.updateSite);
routes.delete('/:id', sites.deleteSite);


export default routes;
