import express, { Router } from "express";
import { getActivity, addActivity } from "../controllers/activityController";
import uploadImages from "../helpers/multer";

const routes: Router = express.Router();

routes.get("/", getActivity);
routes.post("/addactivity", uploadImages.array("files", 3), addActivity);

export default routes;
