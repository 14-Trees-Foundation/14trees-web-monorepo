import express from "express";
import { verifyAdmin, verifyTreeLogger } from "../auth/verifyToken";
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
    getTreeBySaplingId,
    updateSaplingByAdmin,
    getDeltaUsers,
    getDeltaTrees,
} from "../controllers/appV2TreesController";

const routes = express.Router();

routes.get("/healthCheck", healthCheck);
routes.post("/login", login);
routes.post("/fetchHelperData", verifyTreeLogger, fetchHelperData);
routes.post("/fetchShifts", verifyTreeLogger, fetchShifts);
routes.post("/uploadShifts", uploadShifts);
routes.post("/uploadLogs", uploadLogs);
routes.post("/uploadTrees", uploadTrees);
routes.post("/uploadNewImages", uploadNewImages);
routes.post("/treesUpdatePlot", treesUpdatePlot);
routes.post("/getSapling", verifyAdmin, getTreeBySaplingId);
routes.post("/updateSapling", verifyAdmin, updateSaplingByAdmin);
routes.post("/fetchHelperData/users", getDeltaUsers);
routes.post("/fetchHelperData/trees", getDeltaTrees);

export default routes;