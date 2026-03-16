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
routes.get('/gift-dashboard', verifyToken, analytics.giftDashboardAnalytics);

routes.post('/page-visits/track', analytics.trackPageVisit);
routes.get('/page-visits/summary', verifyToken, analytics.pageVisitsSummary);

export default routes;
