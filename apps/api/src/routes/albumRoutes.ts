import express from "express";
import {
  createAlbum,
  getAlbums,
  deleteAlbum,
  getAlbum,
  updateAlbum,
} from "../controllers/albumsController";
import uploadFiles from '../helpers/multer'

const routes = express.Router();

routes.delete("/:id", deleteAlbum);
routes.post("/:email", uploadFiles.array("images", 10), createAlbum);
routes.get("/:email", getAlbums);
routes.get("/id/:album_id", getAlbum);
routes.put("/", uploadFiles.array("images", 10), updateAlbum);

export default routes;