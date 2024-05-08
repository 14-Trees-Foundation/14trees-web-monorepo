import { Router } from 'express';
import { addPlot, updatePlot, getPlots, deletePlot } from '../controllers/plotController';

const routes = Router();

routes.post('/add', addPlot);
routes.post('/update', updatePlot);
routes.get('/', getPlots);
routes.delete('/:id', deletePlot);

export default routes;
