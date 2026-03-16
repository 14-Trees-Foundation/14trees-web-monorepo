import { Router } from 'express';
import * as analytics from '../controllers/analyticsController';
import { verifyToken } from '../auth/verifyToken';

const routes = Router();

routes.get('/totaltrees', analytics.getTotalTree);
routes.get('/totalplanttypes', analytics.getTotalPlantType);
routes.get('/totalponds', analytics.getTotalPonds);
routes.get('/totalemp', analytics.getTotalEmployees);
routes.get('/totalUsers', analytics.getUniqueUsers);
routes.get('/totalPlots', analytics.getTotalPlots);
routes.get('/summary', verifyToken, analytics.summary);
routes.get('/giftcards/summary', verifyToken, analytics.getGiftCardSummaryKPIs);
routes.get('/giftcards/sources', verifyToken, analytics.getGiftCardSources);
routes.get('/giftcards/monthly', verifyToken, analytics.getGiftCardMonthly);
routes.get('/giftcards/tree-distribution', verifyToken, analytics.getGiftCardTreeDistribution);
routes.get('/giftcards/occasions', verifyToken, analytics.getGiftCardOccasions);
routes.get('/giftcards/leaderboard', verifyToken, analytics.getGiftCardLeaderboard);
routes.get('/giftcards/requester/:userId', verifyToken, analytics.getGiftCardRequesterProfile);

routes.post('/page-visits/track', analytics.trackPageVisit);
routes.get('/page-visits/summary', verifyToken, analytics.pageVisitsSummary);

export default routes;
