
const routes = require('express').Router();
const activity = require('../controllers/activityController');
const uploadImages = require('../helpers/multer');

routes.get('/', activity.getActivity);
routes.post('/addactivity', uploadImages.array('files', 3), activity.addActivity);

module.exports = routes;