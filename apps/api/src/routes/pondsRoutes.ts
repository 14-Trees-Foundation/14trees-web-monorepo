import { Router } from "express";
import { Request, Response } from "express";
import * as ponds from "../controllers/pondsController";
import uploadImages from "../helpers/multer";

const routes = Router();

routes.post("/add", uploadImages.array("files", 1), ponds.addPond);
routes.post("/update", uploadImages.array("files", 1), ponds.addUpdate);
routes.get("/", ponds.getPonds);
routes.get("/history", ponds.getHistory);

export default routes;
