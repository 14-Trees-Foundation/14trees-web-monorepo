import { Router } from 'express';
import * as analytics from '../controllers/analyticsController';
import verifyToken from '../auth/verifyToken';

const routes = Router();

routes.get('/totaltrees', analytics.getTotalTree);
routes.get('/totaltreetypes', analytics.getTotalPlantType);
routes.get('/totalponds', analytics.getTotalPonds);
routes.get('/totalemp', analytics.getTotalEmployees);
routes.get('/totalUsers', analytics.getUniqueUsers);
routes.get('/totalPlots', analytics.getTotalPlots);
routes.get('/summary', verifyToken, analytics.summary);

export default routes;