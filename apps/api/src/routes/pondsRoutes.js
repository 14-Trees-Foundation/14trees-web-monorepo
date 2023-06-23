const routes = require('express').Router();
const ponds = require('../controllers/pondsController');
const uploadImages = require('../helpers/multer');

routes.post('/add', uploadImages.array('files', 1), ponds.addPond);
routes.post('/update', uploadImages.array('files', 1), ponds.addUpdate);
routes.get('/', ponds.getPonds);
routes.get('/history', ponds.getHistory);

module.exports = routes;