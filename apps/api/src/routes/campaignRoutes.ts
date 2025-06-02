import express from 'express';
import * as campaigns from '../controllers/campaignController';

const routes = express.Router();

routes.post('/', campaigns.createCampaign);
routes.get('/', campaigns.listCampaigns);
routes.get('/referralcount', campaigns.getReferralCounts);
routes.get('/referral/:rfr', campaigns.getReferralDashboard);
routes.get('/:c_key/analytics', campaigns.getCampaignAnalytics);

export default routes;
