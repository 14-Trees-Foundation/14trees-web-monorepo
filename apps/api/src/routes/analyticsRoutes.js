
const routes = require('express').Router();
const analytics = require('../controllers/analyticsController');
const verifyToken = require('../auth/verifyToken');

routes.get('/totaltrees', analytics.getTotalTree);
routes.get('/totaltreetypes', analytics.getTotalTreeType);
routes.get('/totalponds', analytics.getTotalPonds);
routes.get('/totalemp', analytics.getTotalEmployees);
routes.get('/totalUsers', analytics.getUniqueUsers);
routes.get('/totalPlots', analytics.getTotalPlots);
routes.get('/summary', verifyToken, analytics.summary);

module.exports = routes;