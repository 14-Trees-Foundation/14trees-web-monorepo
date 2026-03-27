import { Router } from 'express';
import { verifyToken } from '../auth/verifyToken';
import * as donationAnalytics from '../controllers/donationAnalyticsController';

const routes = Router();

routes.get('/summary', verifyToken, donationAnalytics.getDonationSummaryKPIs);
routes.get('/monthly', verifyToken, donationAnalytics.getDonationMonthly);
routes.get('/yearly', verifyToken, donationAnalytics.getDonationYearly);
routes.get('/leaderboard', verifyToken, donationAnalytics.getDonorLeaderboard);
routes.get('/donor/:id', verifyToken, donationAnalytics.getDonorProfile);
routes.get('/payment-methods', verifyToken, donationAnalytics.getPaymentMethods);
routes.get('/type-split', verifyToken, donationAnalytics.getDonationTypeSplit);
routes.get('/frequency', verifyToken, donationAnalytics.getDonationFrequency);
routes.get('/repeat-stats', verifyToken, donationAnalytics.getRepeatDonorStats);

export default routes;
