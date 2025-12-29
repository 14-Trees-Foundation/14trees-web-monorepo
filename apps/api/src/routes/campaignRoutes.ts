import express from 'express';
import * as campaigns from '../controllers/campaignController';

const routes = express.Router();

routes.post('/', campaigns.createCampaign);
routes.post('/list/get', campaigns.listCampaigns);
routes.put('/update/:id', campaigns.updateCampaign);
routes.get('/referralcount', campaigns.getReferralCounts);
routes.get('/referral/:rfr', campaigns.getReferralDashboard);
routes.get('/:c_key/analytics', campaigns.getCampaignAnalytics);
routes.get('/:c_key/email-config', campaigns.getCampaignEmailConfig);
routes.put('/:c_key/email-config', campaigns.updateCampaignEmailConfig);

export default routes;
