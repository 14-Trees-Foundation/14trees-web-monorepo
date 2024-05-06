import { Router } from 'express';
import { addPlot, updatePlot, getPlots } from '../controllers/plotController';

const routes = Router();

routes.post('/add', addPlot);
routes.post('/update', updatePlot);
routes.get('/', getPlots);

export default routes;
