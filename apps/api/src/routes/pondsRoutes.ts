import { Router } from "express";
import * as ponds from "../controllers/pondsController";
import uploadImages from "../helpers/multer";

const routes = Router();

// @deprecated
routes.post('/add', uploadImages.array('files', 1), ponds.addPond);
// @deprecated
routes.post('/update', uploadImages.array('files', 1), ponds.addWaterLevelUpdate);

routes.post('/', uploadImages.array('files', 1), ponds.addPond);
routes.put('/:id', uploadImages.array('files', 1), ponds.updatePond);
routes.post('/update-pond-level', uploadImages.array('files', 1), ponds.addWaterLevelUpdate);
routes.get("/", ponds.getPonds);
routes.delete('/:id', ponds.deletePond);
routes.get("/history", ponds.getHistory);

export default routes;
