import { Router } from 'express';
import * as plot from '../controllers/plotController';

const routes = Router();

routes.post('/get', plot.getPlots);
routes.post('/', plot.addPlot);
routes.put('/:id', plot.updatePlot);
routes.delete('/:id', plot.deletePlot);
routes.get('/tags', plot.getPlotTags);
// routes.get('/:search', searchPlots);

export default routes;
