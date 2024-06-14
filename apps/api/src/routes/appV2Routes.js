const routes = require('express').Router();
const v2TreesController = require('../controllers/appV2TreesController');

routes.get('/healthCheck',v2TreesController.healthCheck);
routes.post('/uploadTrees',v2TreesController.uploadTrees);
routes.post('/uploadNewImages',v2TreesController.uploadNewImages);
routes.post('/treesUpdatePlot' , v2TreesController.treesUpdatePlot);
routes.post('/uploadShifts',v2TreesController.uploadShifts)
routes.post('/fetchShifts',v2TreesController.fetchShifts);
routes.post('/uploadLogs',v2TreesController.uploadLogs); 
routes.post('/getSapling',v2TreesController.getSapling); 
routes.post('/updateSapling',v2TreesController.updateSapling);
routes.post('/fetchHelperData',v2TreesController.fetchHelperData);
routes.post('/fetchPlotSaplings',v2TreesController.fetchPlotSaplings);
routes.post('/login',v2TreesController.login);


export default routes;
