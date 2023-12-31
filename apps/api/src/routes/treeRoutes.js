const routes = require('express').Router();
const trees = require('../controllers/treesController');

const uploadImages = require('../helpers/multer');

routes.post('/addtree', uploadImages.array('files', 1), trees.addTree);
routes.get('/gettree', trees.getTree);
routes.post('/addtreetype', uploadImages.array('files', 4), trees.addTreeType);
routes.get('/treetypes', trees.getTreeTypes);
routes.get('/getsaplingid', trees.getTreeFromId);
routes.get('/groupbyplots', trees.treeCountByPlot);
routes.get('/loggedbydate', trees.treeLoggedByDate);
routes.get('/treelogbyuser', trees.treeLogByUser);
routes.get('/treelogbyplot', trees.treeLogByPlot);
routes.get('/treetypecount', trees.treeCountTreeType);
routes.get('/treetypecount/plotwise', trees.treeTypeCountByPlot);
routes.get('/plot/count', trees.countByPlot);
routes.get('/plot/list', trees.treeListByPlot);
routes.post('/update/photo', uploadImages.array('files', 1), trees.addPhotoUpdate);

module.exports = routes;