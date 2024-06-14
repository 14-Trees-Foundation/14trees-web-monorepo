import { Router } from "express";
import * as ponds from "../controllers/pondsController";
import uploadFiles from "../helpers/multer";

const routes = Router();

// @deprecated
// routes.post('/add', uploadFiles.array('files', 1), ponds.addPond);
// @deprecated
// routes.post('/update', uploadFiles.array('files', 1), ponds.addWaterLevelUpdate);

routes.get('/:search', ponds.searchPonds);
routes.post("/get", ponds.getPonds);
routes.post('/', uploadFiles.array('files', 1), ponds.addPond);
routes.put('/:id', uploadFiles.array('files', 1), ponds.updatePond);
routes.delete('/:id', ponds.deletePond);

export default routes;
