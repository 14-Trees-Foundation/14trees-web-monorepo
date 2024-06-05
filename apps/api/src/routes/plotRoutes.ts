import { Router } from 'express';
import { addPlot, updatePlot, getPlots, getPlotsByFilters, deletePlot, searchPlots, updatePlotCoordinates } from '../controllers/plotController';

const routes = Router();

routes.post('/add', addPlot);
routes.post('/update', updatePlotCoordinates);
routes.get('/', getPlots);
routes.post('/get', getPlotsByFilters);
routes.get('/:search', searchPlots);
routes.delete('/:id', deletePlot);
routes.put('/:id', updatePlot);

export default routes;
