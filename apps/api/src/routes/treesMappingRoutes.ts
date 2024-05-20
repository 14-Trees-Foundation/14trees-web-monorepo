import express from "express";
import {
  mapTrees,
  unMapTrees,
  updateEventDataInTrees,
  getMappedTrees,
  deleteAlbum,
  createAlbum,
  getAlbums,
  getUserMappedTreesCount,
  mapTreesInPlot,
} from "../controllers/treesMappingController";
import uploadFiles from "../helpers/multer";

const routes = express.Router();

// below route should be /map
routes.post("/map-plot-trees", mapTreesInPlot);
routes.post("/assign", mapTrees);
routes.post("/unmap", unMapTrees);
routes.get("/:email", getMappedTrees);
routes.get("/count/usertreescount", getUserMappedTreesCount);
routes.post("/count/usertreescount", getUserMappedTreesCount);

routes.post("/update", updateEventDataInTrees);

routes.delete("/albums", deleteAlbum);
routes.post("/albums/:email", uploadFiles.array("images", 10), createAlbum);
routes.get("/albums/:email", getAlbums);

export default routes;
