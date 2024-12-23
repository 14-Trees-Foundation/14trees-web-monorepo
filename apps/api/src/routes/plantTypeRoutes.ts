import { Router } from "express";
import uploadFiles from "../helpers/multer";
import * as plantTypes from '../controllers/plantTypeController'

const routes = Router();

// TreeTypes
routes.get("/tags/get", plantTypes.getPlantTypeTags);
routes.post("/get", plantTypes.getPlantTypes);
routes.get('/:plot_id', plantTypes.getPlantTypesForPlot);
routes.post("/", uploadFiles.array("files", 4), plantTypes.addPlantType);
routes.put('/:id', uploadFiles.array('files', 4), plantTypes.updatePlantType);
routes.delete('/:id', plantTypes.deletePlantType);
routes.post('/states', plantTypes.getTreeCountsForPlantTypes);
routes.post('/sync', plantTypes.syncPlantTypeIllustrationsDataFromNotion);
routes.post('/templates/', plantTypes.addPlantTypeTemplate);
routes.post('/illustrations/', plantTypes.uploadIllustrationsToS3);

export default routes;