import express from "express";
import {
    healthCheck,
    login,
    fetchHelperData,
} from "../controllers/appV2TreesController";

const routes = express.Router();

routes.get("/healthCheck", healthCheck);
routes.post("/login", login);
routes.post("/fetchHelperData", fetchHelperData);

export default routes;