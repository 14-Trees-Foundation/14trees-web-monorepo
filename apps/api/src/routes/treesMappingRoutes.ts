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
} from "../controllers/treesMappingController";
import uploadImages from "../helpers/multer";

const routes = express.Router();

// below route should be /map
routes.post("/assign", mapTrees);
routes.post("/unmap", unMapTrees);
routes.get("/:email", getMappedTrees);
routes.get("/count/usertreescount", getUserMappedTreesCount);

routes.post("/update", updateEventDataInTrees);

routes.delete("/albums", deleteAlbum);
routes.post("/albums/:email", uploadImages.array("images", 10), createAlbum);
routes.get("/albums/:email", getAlbums);

export default routes;
