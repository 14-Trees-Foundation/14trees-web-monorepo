import { Router } from 'express';
import * as autoPrsReq from '../controllers/autoPrsReqController';
import { verifyToken } from '../auth/verifyToken';

const routes = Router();

/**
 * @swagger
 * /auto-process/addPlots:
 *   post:
 *     summary: Add plots for auto-processing
 *     description: Adds plots to be used for auto-processing gift or donation requests. Duplicate plot_ids for the same type are ignored.
 *     tags:
 *       - Auto-Processing Configuration
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - plot_ids
 *               - type
 *             properties:
 *               plot_ids:
 *                 type: array
 *                 items:
 *                   type: integer
 *                 example: [1, 2, 125]
 *               type:
 *                 type: string
 *                 enum: [donation, gift]
 *                 example: "gift"
 *     responses:
 *       201:
 *         description: Plots added successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/definitions/AutoPrsReqPlot'
 *       400:
 *         description: Bad request (validation errors)
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 error:
 *                   type: string
 *                   example: "plot_ids and type are required"
 *       500:
 *         description: Internal server error
 */
routes.post('/addPlots', verifyToken, autoPrsReq.addPlot);

/**
 * @swagger
 * /auto-process/getPlots:
 *   post:
 *     summary: Get configured plots for auto-processing
 *     description: Retrieves plots configured for auto-processing of the specified type (gift or donation).
 *     tags:
 *       - Auto-Processing Configuration
 *     parameters:
 *       - name: type
 *         in: query
 *         required: true
 *         schema:
 *           type: string
 *           enum: [donation, gift]
 *         example: "gift"
 *     requestBody:
 *       required: false
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               filters:
 *                 type: array
 *                 items:
 *                   $ref: '#/definitions/Filter'
 *               order_by:
 *                 type: array
 *                 items:
 *                   $ref: '#/definitions/OrderBy'
 *     responses:
 *       200:
 *         description: Plots retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 results:
 *                   type: array
 *                   items:
 *                     type: object
 *                 total:
 *                   type: integer
 *                 offset:
 *                   type: integer
 *       400:
 *         description: Bad request (invalid type)
 *       404:
 *         description: No plots found for this type
 *       500:
 *         description: Internal server error
 */
routes.post('/getPlots', autoPrsReq.getPlotData);

/**
 * @swagger
 * /auto-process/removePlots:
 *   delete:
 *     summary: Remove specific plots from auto-processing
 *     description: Removes specified plots from auto-processing configuration for the given type.
 *     tags:
 *       - Auto-Processing Configuration
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - plot_ids
 *               - type
 *             properties:
 *               plot_ids:
 *                 type: array
 *                 items:
 *                   type: integer
 *                 example: [1, 2, 125]
 *               type:
 *                 type: string
 *                 enum: [donation, gift]
 *                 example: "gift"
 *     responses:
 *       200:
 *         description: Plots removed successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: "Successfully removed 3 plot(s)"
 *                 deletedCount:
 *                   type: integer
 *                   example: 3
 *       400:
 *         description: Bad request (validation errors)
 *       404:
 *         description: No plots found to remove
 *       500:
 *         description: Internal server error
 */
routes.delete('/removePlots', verifyToken, autoPrsReq.removePlot);

/**
 * @swagger
 * /auto-process/removeAllPlots:
 *   delete:
 *     summary: Remove all plots for a type from auto-processing
 *     description: Removes all plots configured for auto-processing of the specified type.
 *     tags:
 *       - Auto-Processing Configuration
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - type
 *             properties:
 *               type:
 *                 type: string
 *                 enum: [donation, gift]
 *                 example: "gift"
 *     responses:
 *       200:
 *         description: All plots removed successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: "Successfully removed all 5 plot(s) for type \"gift\""
 *                 deletedCount:
 *                   type: integer
 *                   example: 5
 *       400:
 *         description: Bad request (validation errors)
 *       404:
 *         description: No plots found to remove
 *       500:
 *         description: Internal server error
 */
routes.delete('/removeAllPlots', verifyToken, autoPrsReq.removeAllPlots);

export default routes;