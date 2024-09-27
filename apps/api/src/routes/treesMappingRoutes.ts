import express from "express";
import {
  mapTrees,
  unMapTrees,
  getMappedTrees,
  getUserMappedTreesCount,
  mapTreesInPlot,
  mapTreesInPlots,
} from "../controllers/treesMappingController";

const routes = express.Router();

// below route should be /map
routes.post("/map-plot-trees", mapTreesInPlot);
routes.post("/map-multi-plots-trees", mapTreesInPlots);
routes.post("/map", mapTrees);
routes.post("/unmap", unMapTrees);
routes.get("/:email", getMappedTrees);
routes.get("/count/usertreescount", getUserMappedTreesCount);

// routes.post("/update", updateEventDataInTrees);

export default routes;
