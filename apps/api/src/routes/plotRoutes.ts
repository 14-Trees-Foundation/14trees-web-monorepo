import { Router } from 'express';
import * as plot from '../controllers/plotController';
import uploadFiles from "../helpers/multer";

const routes = Router();

routes.post('/get', plot.getPlots);
routes.post('/', plot.addPlot);
routes.put('/:id', plot.updatePlot);
routes.delete('/:id', plot.deletePlot);
routes.get('/tags', plot.getPlotTags);
routes.post('/assign-site', plot.assignPlotsToSite);
routes.post('/kml', uploadFiles.single('file'), plot.updateCoordinatesUsingKml);
// routes.get('/:search', searchPlots);

routes.get('/stats/category', plot.treesCountForCategory);

export default routes;
