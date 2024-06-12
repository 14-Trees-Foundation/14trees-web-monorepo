import { Router } from 'express';
import { addPlot, updatePlot, getPlots, deletePlot } from '../controllers/plotController';

const routes = Router();

routes.post('/get', getPlots);
routes.post('/', addPlot);
routes.put('/:id', updatePlot);
routes.delete('/:id', deletePlot);
// routes.get('/:search', searchPlots);

export default routes;
