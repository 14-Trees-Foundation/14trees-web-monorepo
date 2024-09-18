import express from "express";
import { verifyAdmin, verifyTreeLogger } from "../auth/verifyToken";
import {
    healthCheck,
    testUpload,
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
    getDeltaSites,
    getDeltaPlots,
    getDeltaVisits,
    getDeltaVisitImages,
    getDeltaTreeSnapshots,
    getDeltaSyncHistories,
    getDeltaPlantTypes,
    treesCount,
} from "../controllers/appV2TreesController";
import {
    addSyncHistory
} from '../controllers/syncHistoryController'

const routes = express.Router();

routes.get("/healthCheck", healthCheck);
routes.post("/test-upload", testUpload);
routes.post("/login", login);
routes.post("/fetchHelperData", verifyTreeLogger, fetchHelperData);
routes.post("/fetchShifts", verifyTreeLogger, fetchShifts);
routes.post("/uploadShifts", uploadShifts);
routes.post("/uploadLogs", uploadLogs);
routes.post("/uploadTrees", uploadTrees);
routes.post("/uploadNewImages", uploadNewImages);
routes.post("/treesUpdatePlot", treesUpdatePlot);
routes.post("/getSapling", verifyAdmin, getTreeBySaplingId);
routes.post("/updateSapling", updateSaplingByAdmin);
routes.post("/fetchHelperData/users", getDeltaUsers);
routes.post("/fetchHelperData/trees", getDeltaTrees);
routes.post("/fetchHelperData/sites", getDeltaSites);
routes.post("/fetchHelperData/plots", getDeltaPlots);
routes.post("/fetchHelperData/visits", getDeltaVisits);
routes.post("/fetchHelperData/visit-images", getDeltaVisitImages);
routes.post("/fetchHelperData/tree-snapshots", getDeltaTreeSnapshots);
routes.post("/fetchHelperData/sync-history", getDeltaSyncHistories);
routes.post("/fetchHelperData/plant-types", getDeltaPlantTypes);
routes.post("/sync-history", addSyncHistory);
routes.get("/trees-count", treesCount);

export default routes;