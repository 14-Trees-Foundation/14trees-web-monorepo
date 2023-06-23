const routes = require('express').Router();
const plots = require('../controllers/plotController');

routes.post('/add', plots.addPlot);
routes.post('/update', plots.updatePlot);
routes.get('/', plots.getPlots);

module.exports = routes;