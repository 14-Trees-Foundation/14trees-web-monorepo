import express from "express";
import {
    healthCheck,
    login,
    fetchHelperData,
    fetchShifts,
    uploadShifts,
    uploadLogs,
    uploadTrees,
    uploadNewImages,
    treesUpdatePlot,
} from "../controllers/appV2TreesController";

const routes = express.Router();

routes.get("/healthCheck", healthCheck);
routes.post("/login", login);
routes.post("/fetchHelperData", fetchHelperData);
routes.post("/fetchShifts", fetchShifts);
routes.post("/uploadShifts", uploadShifts);
routes.post("/uploadLogs", uploadLogs);
routes.post("/uploadTrees", uploadTrees);
routes.post("/uploadNewImages", uploadNewImages);
routes.post("/treesUpdatePlot", treesUpdatePlot);

export default routes;