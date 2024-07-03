import express from "express";
import {
  mapTrees,
  unMapTrees,
  getMappedTrees,
  getUserMappedTreesCount,
  mapTreesInPlot,
} from "../controllers/treesMappingController";

const routes = express.Router();

// below route should be /map
routes.post("/map-plot-trees", mapTreesInPlot);
routes.post("/map", mapTrees);
routes.post("/unmap", unMapTrees);
routes.get("/:email", getMappedTrees);
routes.get("/count/usertreescount", getUserMappedTreesCount);

// routes.post("/update", updateEventDataInTrees);

export default routes;
