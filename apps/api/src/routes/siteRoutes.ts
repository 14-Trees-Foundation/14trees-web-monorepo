import express from 'express';
import * as sites from '../controllers/siteController';
import uploadFiles from "../helpers/multer";

const routes = express.Router();

routes.post('/get', sites.getSites);
routes.post('/', uploadFiles.single("file"), sites.addSite);
routes.put('/:id',uploadFiles.single("file"), sites.updateSite);
routes.delete('/:id', sites.deleteSite);
routes.post('/sync-sites', sites.syncSitesDatFromNotion);
routes.post('/stats', sites.getTreeCountsForSites);
routes.post('/stats/:field', sites.getTreesCountForField);
routes.get('/districts', sites.getDistrictsData);


export default routes;
