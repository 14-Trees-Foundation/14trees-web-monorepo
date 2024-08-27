import express from 'express';
import * as sites from '../controllers/siteController';
import uploadFiles from "../helpers/multer";

const routes = express.Router();

routes.post('/get', sites.getSites);
routes.post('/', sites.addSite);
routes.put('/:id',uploadFiles.array("files" , 4), sites.updateSite);
routes.delete('/:id', sites.deleteSite);
routes.post('/sync-sites', sites.syncSitesDatFromNotion);


export default routes;
