import { Router } from "express";
import * as events from "../controllers/eventsController";
import uploadFiles from "../helpers/multer";

const routes = Router();

// @deprecated
// routes.post('/addevents', uploadFiles.array('files',1), events.addEvents);

routes.post('/get', events.getEvents);
routes.delete('/:id', events.deleteEvent);
// Add/Update event with file upload support (event_poster and images)
routes.post('/', 
  uploadFiles.fields([
    { name: 'event_poster', maxCount: 1 },
    { name: 'landing_image', maxCount: 1 },
    { name: 'landing_image_mobile', maxCount: 1 },
    { name: 'images', maxCount: 10 }
  ]), 
  events.addEvent
);

routes.put('/:id', 
  uploadFiles.fields([
    { name: 'event_poster', maxCount: 1 },
    { name: 'landing_image', maxCount: 1 },
    { name: 'landing_image_mobile', maxCount: 1 },
    { name: 'images', maxCount: 10 }
  ]), 
  events.updateEvent
);

// add support for file uploads (event_poster and images) and improve location and theme color attributes)
routes.get('/messages/:event_id' , events.getEventMessages);
// routes.get("/birthday", events.getBirthdayEvent);
// routes.get("/org", events.getOverallOrgDashboard);
// routes.get("/plot", events.getOverallPlotDashboard);

routes.post("/corp/add", uploadFiles.array("files", 12), events.addCorpEvent);
routes.get("/corp/", events.getCorpEvent);
routes.put('/corp/:id', events.updateCorpEvent);
routes.delete('/corp/:id', events.deleteCorpEvent);

// ===== NEW EVENT ASSOCIATION ROUTES =====

// Tree Association Routes
routes.get('/:id/trees', events.getEventTrees);
routes.post('/:id/trees', events.associateTreesToEvent);
routes.delete('/:id/trees', events.dissociateTreesFromEvent);

// Image Association Routes
routes.get('/:id/images', events.getEventImages);
routes.post('/:id/images', uploadFiles.array('images', 10), events.uploadEventImages);
routes.delete('/:id/images', events.removeEventImages);
routes.put('/:id/images/reorder', events.reorderEventImages);

// Enhanced Message Routes
routes.post('/:id/messages', events.createEventMessage);
routes.put('/messages/:messageId', events.updateEventMessage);
routes.delete('/messages/:messageId', events.deleteEventMessage);
routes.put('/:id/messages/reorder', events.reorderEventMessages);

export default routes;
