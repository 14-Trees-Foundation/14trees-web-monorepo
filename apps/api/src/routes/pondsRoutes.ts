import { Router } from "express";
import * as ponds from "../controllers/pondsController";
import uploadFiles from "../helpers/multer";

const routes = Router();

// @deprecated
// routes.post('/add', uploadFiles.array('files', 1), ponds.addPond);
// @deprecated
// routes.post('/update', uploadFiles.array('files', 1), ponds.addWaterLevelUpdate);

// routes.post('/', uploadFiles.array('files', 1), ponds.addPond);
// routes.put('/:id', uploadFiles.array('files', 1), ponds.updatePond);
// routes.post('/update-pond-level', uploadFiles.array('files', 1), ponds.addWaterLevelUpdate);
routes.get("/", ponds.getPonds);
// routes.get('/:search', ponds.searchPonds);
routes.delete('/:id', ponds.deletePond);
routes.get("/history", ponds.getHistory);

export default routes;
