import express from 'express';
import * as sites from '../controllers/siteController';

const routes = express.Router();

routes.get('/', sites.getSites);


export default routes;
