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
routes.get('/giftcards/personal-requests', analytics.getPersonalGiftRequests);
routes.get('/giftcards/corporate-requests', analytics.getCorporateGiftRequests); 
routes.get('/giftcards/personal-trees',  analytics.getPersonalGiftedTrees);
routes.get('/giftcards/corporate-trees', analytics.getCorporateGiftedTrees);
routes.get('/summary', verifyToken, analytics.summary);

export default routes;