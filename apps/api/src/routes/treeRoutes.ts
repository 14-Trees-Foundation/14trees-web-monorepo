import { Router } from "express";
import * as trees from "../controllers/treesController";
import uploadImages from "../helpers/multer";

const routes = Router();

// TreeTypes
routes.get("/treetypes", trees.getTreeTypes);
routes.post("/addtreetype", uploadImages.array("files", 4), trees.addTreeType);
routes.put('/treetypes/:id', uploadImages.array('files', 4), trees.updateTreeType);
routes.delete('/treetypes/:id', trees.deleteTreeType);

// Trees
// @deprecated
routes.get('/gettree', trees.getTree);
// @deprecated
routes.post('/addtree', uploadImages.array('files', 1), trees.addTree);

routes.get('/', trees.getTree);
routes.post('/', uploadImages.array('files', 1), trees.addTree);
routes.post('/bulk', uploadImages.fields([{name: 'files', maxCount: 1}, {name: 'csvFile', maxCount: 1}]), trees.addTreesBulk);
routes.put('/:id', uploadImages.array('files', 1), trees.updateTree);
routes.delete('/:id', uploadImages.array('files', 1), trees.deleteTree);


routes.get("/getsaplingid", trees.getTreeFromId);
routes.get("/groupbyplots", trees.treeCountByPlot);
routes.get("/loggedbydate", trees.treeLoggedByDate);
routes.get("/treelogbyuser", trees.treeLogByUser);
routes.get("/treelogbyplot", trees.treeLogByPlot);
routes.get("/treetypecount", trees.treeCountTreeType);
routes.get("/treetypecount/plotwise", trees.treeTypeCountByPlot);
routes.get("/plot/count", trees.countByPlot);
routes.get("/plot/list", trees.treeListByPlot);
routes.post('/update/photo', uploadImages.array('files', 1), trees.addPhotoUpdate);

export default routes;
