import { Router } from 'express';
import * as plot from '../controllers/plotController';
import uploadFiles from "../helpers/multer";

const routes = Router();


/**
 * @swagger
 * /plots/get:
 *   post:
 *     summary: Get plots
 *     description: Fetches a list of plots with optional filters and sorting.
 *     tags:
 *       - Plots
 *     parameters:
 *       - in: body
 *         name: body
 *         description: Request body for fetching plots
 *         required: false
 *         schema:
 *           type: object
 *           properties:
 *             filters:
 *               type: array
 *               items:
 *                 $ref: '#/definitions/Filter'
 *             order_by:
 *               type: array
 *               items:
 *                 $ref: '#/definitions/OrderBy'
 *       - name: offset
 *         in: query
 *         description: Offset for pagination
 *         required: false
 *         type: integer
 *         example: 0
 *       - name: limit
 *         in: query
 *         description: Limit for pagination
 *         required: false
 *         type: integer
 *         example: 10
 *     responses:
 *       200:
 *         description: Plots fetched successfully
 *         schema:
 *           type: object
 *           properties:
 *             offset:
 *               type: integer
 *               example: 0
 *             total:
 *               type: integer
 *               example: 20
 *             results:
 *               type: array
 *               items:
 *                 $ref: '#/definitions/Plot'
 *       500:
 *         description: Internal server error
 *         schema:
 *           type: object
 *           properties:
 *             message:
 *               type: string
 *               example: "Something went wrong. Please try again after some time"
 */
routes.post('/get', plot.getPlots);
routes.post('/', plot.addPlot);
routes.put('/:id', plot.updatePlot);
routes.delete('/:id', plot.deletePlot);
routes.post('/assign-site', plot.assignPlotsToSite);
routes.post('/kml', uploadFiles.single('file'), plot.updateCoordinatesUsingKml);
// routes.get('/:search', searchPlots);

routes.get('/stats/category', plot.treesCountForCategory);
routes.post('/stats', plot.getPlotAggregations);
routes.post('/corporate-stats', plot.getPlotStatesForCorporate);
routes.get('/corporate-analytics', plot.getCSRTreesAnalysis);

export default routes;
