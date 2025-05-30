import express from 'express';
import * as campaigns from '../controllers/campaignController';

const routes = express.Router();

routes.post('/', campaigns.createCampaign);

export default routes;
