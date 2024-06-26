import { Router } from "express";
import * as ponds from "../controllers/pondsController";
import * as waterLevel from "../controllers/pondsWaterLevelUpdateController";
import uploadFiles from "../helpers/multer";

const routes = Router();

routes.get('/:search', ponds.searchPonds);
routes.post("/get", ponds.getPonds);
routes.post('/', uploadFiles.array('files', 1), ponds.addPond);
routes.put('/:id', uploadFiles.array('files', 1), ponds.updatePond);
routes.delete('/:id', ponds.deletePond);

// water level updates
routes.get('/waterlevel/:pond_id', waterLevel.getPondWaterLevelUpdates);
routes.post('/waterlevel', uploadFiles.array('files', 1), waterLevel.addPondWaterLevelUpdate);
routes.put('/waterlevel/:id', uploadFiles.array('files', 1), waterLevel.updatePondWaterLevelEntry);
routes.delete('/waterlevel/:id', waterLevel.deletePondWaterLevelUpdate);

export default routes;
