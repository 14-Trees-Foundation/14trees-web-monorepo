import express from 'express';
import * as orgs from '../controllers/orgController';

const routes = express.Router();

routes.post('/add', orgs.addOrg);
routes.get('/', orgs.getOrgs);
routes.post('/', orgs.addOrg);
routes.put('/:id', orgs.updateOrg);
routes.delete('/:id', orgs.deleteOrg);

export default routes;
