import { Router } from "express";
import * as events from "../controllers/eventsController";
import uploadImages from "../helpers/multer";

const routes = Router();

// @deprecated
routes.post('/addevents', uploadImages.array('files',1), events.addEvents);

routes.get('/', events.getEvents);
routes.post('/', uploadImages.array('files', 1), events.addEvents);
routes.delete('/:id', events.deleteEvent);
routes.get("/birthday", events.getBirthdayEvent);
routes.get("/org", events.getOverallOrgDashboard);
routes.get("/plot", events.getOverallPlotDashboard);

routes.post("/corp/add", uploadImages.array("files", 12), events.addCorpEvent);
routes.get("/corp/", events.getCorpEvent);
routes.put('/corp/:id', events.updateCorpEvent);
routes.delete('/corp/:id', events.deleteCorpEvent);

export default routes;
