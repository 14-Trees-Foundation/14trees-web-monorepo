
const routes = require('express').Router();
const donate = require('../controllers/mytreesController');
const uploadImages = require('../helpers/multer');

routes.post('/assign', donate.addTrees);
routes.post('/update', donate.updateTrees);
routes.get('/:email', donate.getTrees);
routes.delete('/albums', donate.deleteAlbum);
routes.post('/albums/:email', uploadImages.array('images', 10), donate.createAlbum)
routes.get('/albums/:email', donate.getAlbums);
routes.get('/count/usertreescount', donate.getUserTreeCount);

module.exports = routes;