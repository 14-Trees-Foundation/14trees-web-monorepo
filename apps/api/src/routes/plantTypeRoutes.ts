import { Router } from "express";
import uploadFiles from "../helpers/multer";
import * as plantTypes from '../controllers/plantTypeController'

const routes = Router();

// TreeTypes
routes.post("/get", plantTypes.getPlantTypes);
// routes.get('/:search', plantTypes.searchTreeTypes);
routes.post("/", uploadFiles.array("files", 4), plantTypes.addPlantType);
routes.put('/:id', uploadFiles.array('files', 4), plantTypes.updatePlantType);
routes.delete('/:id', plantTypes.deletePlantType);

export default routes;