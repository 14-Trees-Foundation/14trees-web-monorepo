
const routes = require('express').Router();
const events = require('../controllers/eventsController');
const uploadImages = require('../helpers/multer');

routes.post('/addevents', uploadImages.array('files', 1), events.addEvents);
routes.get('/birthday', events.getBirthdayEvent);
routes.get('/org', events.getOverallOrgDashboard)
routes.get('/plot', events.getOverallPlotDashboard)
routes.post('/corp/add', uploadImages.array('files', 12), events.addCorpEvent);
routes.get('/corp/', events.getCorpEvent);

module.exports = routes;