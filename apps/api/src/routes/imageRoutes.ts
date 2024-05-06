import { Router } from "express";
import { addMemories } from "../controllers/imageController";
import uploadImages from "../helpers/multer";

const routes = Router();

routes.post("/addmemories", uploadImages.array("files", 10), addMemories);

export default routes;
