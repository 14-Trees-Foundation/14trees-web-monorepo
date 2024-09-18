import { Router } from "express";
import * as trees from "../controllers/treesController";
import uploadFiles from "../helpers/multer";
import * as treeTypes from '../controllers/plantTypeController'

const routes = Router();

// TreeTypes
// routes.get("/treetypes", treeTypes.getTreeTypes);
// routes.post("/treetypes", treeTypes.getTreeTypes);
// routes.get('/:search', treeTypes.searchTreeTypes);
// routes.post("/addtreetype", uploadFiles.array("files", 4), treeTypes.addTreeType);
// routes.put('/treetypes/:id', uploadFiles.array('files', 4), treeTypes.updateTreeType);
// routes.delete('/treetypes/:id', treeTypes.deleteTreeType);

// // Trees

// @deprecated
routes.post('/addtree', uploadFiles.array('files', 1), trees.addTree);

routes.post('/get', trees.getTrees);
routes.post('/', uploadFiles.array('files', 1), trees.addTree);
// routes.post('/bulk', uploadFiles.fields([{name: 'files', maxCount: 1}, {name: 'csvFile', maxCount: 1}]), trees.addTreesBulk);
routes.put('/:id', uploadFiles.array('files', 1), trees.updateTree);
routes.delete('/:id', uploadFiles.array('files', 1), trees.deleteTree);
routes.post('/change-plot', trees.changeTreesPlot);

// // the below route should be /get-tree-by-mongo-id or /get-tree-by-id
routes.get("/getsaplingid", trees.getTreeFromId);

// // the below route should be /get-tree-by-sapling-id
routes.get('/gettree', trees.getTree);
routes.get("/groupbyplots", trees.treeCountByPlot);
routes.get("/loggedbydate", trees.treeLoggedByDate);
routes.get("/treelogbyuser", trees.treeLogByUser);
routes.get("/treelogbyplot", trees.treeLogByPlot);
routes.get("/treetypecount", trees.treeCountTreeType);
routes.get("/treetypecount/plotwise", trees.treeTypeCountByPlot);

routes.get("/assigned/:user_id", trees.getAssignedTrees);
// routes.get("/plot/count", trees.countByPlot);
// routes.get("/plot/list", trees.treeListByPlot);
// routes.post('/update/photo', uploadFiles.array('files', 1), trees.addPhotoUpdate);

export default routes;
