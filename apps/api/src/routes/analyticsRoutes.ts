import { Router } from 'express';
import * as analytics from '../controllers/analyticsController';
import { verifyToken } from '../auth/verifyToken';
import { summary, getTimeRangeAnalytics } from '../controllers/analyticsController';

const routes = Router();

routes.get('/totaltrees', analytics.getTotalTree);
routes.get('/totalplanttypes', analytics.getTotalPlantType);
routes.get('/totalponds', analytics.getTotalPonds);
routes.get('/totalemp', analytics.getTotalEmployees);  
routes.get('/totalUsers', analytics.getUniqueUsers);
routes.get('/totalPlots', analytics.getTotalPlots);
routes.get('/summary', verifyToken, analytics.summary);

/**
 * @swagger
 * /analytics/time-range:
 *   get:
 *     tags:
 *       - Analytics
 *     summary: Get analytics data for a specific time range
 *     parameters:
 *       - in: query
 *         name: startDate
 *         required: true
 *         schema:
 *           type: string
 *           format: date
 *         description: Start date for analytics (YYYY-MM-DD)
 *       - in: query
 *         name: endDate
 *         required: true
 *         schema:
 *           type: string
 *           format: date
 *         description: End date for analytics (YYYY-MM-DD)
 *     responses:
 *       200:
 *         description: Successfully retrieved analytics data
 *       400:
 *         description: Invalid parameters
 *       500:
 *         description: Server error
 */
routes.get('/time-range', getTimeRangeAnalytics);

export default routes;