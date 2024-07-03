import express from "express";
import {
  createAlbum,
  getAlbums,
  deleteAlbum
} from "../controllers/albumsController";
import uploadFiles from '../helpers/multer'

const routes = express.Router();

routes.delete("/:id", deleteAlbum);
routes.post("/:email", uploadFiles.array("images", 10), createAlbum);
routes.get("/:email", getAlbums);

export default routes;