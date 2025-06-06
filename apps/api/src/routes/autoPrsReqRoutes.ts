import { Router } from 'express';
import * as autoPrsReq from '../controllers/autoPrsReqController';
import { verifyToken } from '../auth/verifyToken';

const routes = Router();

/**
 * @swagger
 * /auto-process/create:
 *   post:
 *     summary: Create a new plot record
 *     description: Creates a new plot record with type either 'donation' or 'gift'. A plot_id can exist once per type.
 *     tags:
 *       - Plots
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - plot_id
 *               - type
 *             properties:
 *               plot_id:
 *                 type: string
 *                 example: "2,125"
 *               type:
 *                 type: string
 *                 enum: [donation, gift]
 *                 example: "donation"
 *     responses:
 *       201:
 *         description: Plot created successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/definitions/AutoPrsReqPlot'
 *       400:
 *         description: Bad request (validation errors)
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 error:
 *                   type: string
 *                   example: "type must be either 'donation' or 'gift'"
 *       409:
 *         description: Conflict (plot_id already exists for this type)
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 error:
 *                   type: string
 *                   example: "Plot 1,896 already exists for type donation"
 *       500:
 *         description: Internal server error
 */
routes.post('/addPlots', verifyToken, autoPrsReq.addPlot); // Add auth middleware if needed

routes.get('/getPlot', autoPrsReq.getPlotData);

export default routes;