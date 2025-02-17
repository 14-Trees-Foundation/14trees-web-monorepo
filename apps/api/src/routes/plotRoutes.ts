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


/**
 * @swagger
 * /plots:
 *   post:
 *     summary: Add a new plot
 *     description: Adds a new plot to the system.
 *     tags:
 *       - Plots
 *     parameters:
 *       - in: body
 *         name: body
 *         description: Request body for adding a new plot
 *         required: true
 *         schema:
 *           type: object
 *           properties:
 *             plot_name:
 *               type: string
 *               example: "Plot A"
 *             site_id:
 *               type: integer
 *               example: 1
 *             tags:
 *               type: array
 *               items:
 *                 type: string
 *               example: ["tag1", "tag2"]
 *             gat:
 *               type: string
 *               example: "GAT123"
 *             category:
 *               type: string
 *               example: "Category A"
 *             label:
 *               type: string
 *               example: "Label A"
 *             accessibility_status:
 *               type: string
 *               example: "Accessible"
 *             pit_count:
 *               type: integer
 *               example: 100
 *     responses:
 *       201:
 *         description: Plot created successfully
 *         schema:
 *           $ref: '#/definitions/Plot'
 *       400:
 *         description: Bad request
 *         schema:
 *           type: object
 *           properties:
 *             error:
 *               type: string
 *               example: "Plot name is required"
 *       500:
 *         description: Internal server error
 *         schema:
 *           type: object
 *           properties:
 *             error:
 *               type: string
 *               example: "Something went wrong. Please try again later."
 */
routes.post('/', plot.addPlot);


/**
 * @swagger
 * /plots/{id}:
 *   put:
 *     summary: Update plot
 *     description: Updates an existing plot.
 *     tags:
 *       - Plots
 *     parameters:
 *       - in: body
 *         name: body
 *         description: Request body for updating a plot
 *         required: true
 *         schema:
 *           $ref: '#/definitions/Plot'
 *     responses:
 *       201:
 *         description: Plot updated successfully
 *         schema:
 *           $ref: '#/definitions/Plot'
 *       500:
 *         description: Internal server error
 *         schema:
 *           type: object
 *           properties:
 *             error:
 *               type: string
 *               example: "Something went wrong. Please try again later."
 */
routes.put('/:id', plot.updatePlot);


/**
 * @swagger
 * /plots/{id}:
 *   delete:
 *     summary: Delete plot
 *     description: Deletes a plot by its ID.
 *     tags:
 *       - Plots
 *     parameters:
 *       - name: id
 *         in: path
 *         description: ID of the plot to delete
 *         required: true
 *         type: integer
 *         example: 1
 *     responses:
 *       200:
 *         description: Plot deleted successfully
 *         schema:
 *           type: object
 *           properties:
 *             message:
 *               type: string
 *               example: "Plot deleted successfully"
 *       400:
 *         description: Bad request
 *         schema:
 *           type: object
 *           properties:
 *             error:
 *               type: string
 *               example: "Invalid plot ID"
 *       500:
 *         description: Internal server error
 *         schema:
 *           type: object
 *           properties:
 *             error:
 *               type: string
 *               example: "Something went wrong. Please try again later."
 */
routes.delete('/:id', plot.deletePlot);


/**
 * @swagger
 * /plots/assign-site:
 *   put:
 *     summary: Assign plots to site
 *     description: Assigns multiple plots to a specific site.
 *     tags:
 *       - Plots
 *     parameters:
 *       - in: body
 *         name: body
 *         description: Request body for assigning plots to a site
 *         required: true
 *         schema:
 *           type: object
 *           properties:
 *             plot_ids:
 *               type: array
 *               items:
 *                 type: integer
 *               example: [1, 2, 3]
 *             site_id:
 *               type: integer
 *               example: 1
 *     responses:
 *       200:
 *         description: Plots assigned to site successfully
 *       500:
 *         description: Internal server error
 *         schema:
 *           type: object
 *           properties:
 *             error:
 *               type: string
 *               example: "Something went wrong. Please try again after some time."
 */
routes.post('/assign-site', plot.assignPlotsToSite);


/**
 * @swagger
 * /plots/kml:
 *   post:
 *     summary: Update plot coordinates using KML file
 *     description: Updates the coordinates of plots using a KML file.
 *     tags:
 *       - Plots
 *     consumes:
 *       - multipart/form-data
 *     parameters:
 *       - in: formData
 *         name: site_id
 *         description: ID of the site
 *         required: true
 *         type: integer
 *         example: 1
 *       - in: formData
 *         name: file
 *         description: KML file containing plot coordinates
 *         required: true
 *         type: file
 *     responses:
 *       200:
 *         description: Plot coordinates updated successfully
 *       400:
 *         description: Bad request
 *         schema:
 *           type: object
 *           properties:
 *             error:
 *               type: string
 *               example: "Site id is required"
 *       500:
 *         description: Internal server error
 *         schema:
 *           type: object
 *           properties:
 *             error:
 *               type: string
 *               example: "Something went wrong. Please try again after some time."
 */
routes.post('/kml', uploadFiles.single('file'), plot.updateCoordinatesUsingKml);


/**
 * @swagger
 * /treesCountForCategory:
 *   get:
 *     summary: Get trees count for category
 *     description: Fetches the count of trees for each category.
 *     tags:
 *       - Plots
 *     responses:
 *       200:
 *         description: Trees count for category fetched successfully
 *         schema:
 *           type: object
 *           properties:
 *             category:
 *               type: string
 *               example: "Category A"
 *             count:
 *               type: integer
 *               example: 100
 *       500:
 *         description: Internal server error
 *         schema:
 *           type: object
 *           properties:
 *             status:
 *               type: string
 *               example: "error"
 *             message:
 *               type: string
 *               example: "Something went wrong. Please try again after some time."
 */
routes.get('/stats/category', plot.treesCountForCategory);


/**
 * @swagger
 * /plots/stats:
 *   post:
 *     summary: Get plot aggregations
 *     description: Fetches plot aggregations with optional filters and sorting.
 *     tags:
 *       - Plots
 *     parameters:
 *       - in: body
 *         name: body
 *         description: Request body for fetching plot aggregations
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
 *         description: Plot aggregations fetched successfully
 *         schema:
 *           type: object
 *           properties:
 *             results:
 *               type: array
 *               items:
 *                 type: object
 *                 properties:
 *                   id:
 *                     type: integer
 *                     example: 1
 *                   name:
 *                     type: string
 *                     example: "Plot XYZ"
 *                   total:
 *                     type: integer
 *                     example: 100
 *                   booked:
 *                     type: integer
 *                     example: 50
 *                   assigned:
 *                     type: integer
 *                     example: 30
 *                   available:
 *                     type: integer
 *                     example: 20
 *                   unbooked_assigned:
 *                     type: integer
 *                     example: 10
 *       500:
 *         description: Internal server error
 *         schema:
 *           type: object
 *           properties:
 *             status:
 *               type: string
 *               example: "error"
 *             message:
 *               type: string
 *               example: "Something went wrong. Please try again after some time."
 */
routes.post('/stats', plot.getPlotAggregations);


/**
 * @swagger
 * /plots/corporate-states:
 *   post:
 *     summary: Get plot states for corporate
 *     description: Fetches plot states for corporate with optional filters and sorting.
 *     tags:
 *       - Plots
 *     parameters:
 *       - in: body
 *         name: body
 *         description: Request body for fetching plot states for corporate
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
 *             group_id:
 *               type: integer
 *               example: 1
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
 *         description: Plot states for corporate fetched successfully
 *         schema:
 *           type: object
 *           properties:
 *             results:
 *               type: array
 *               items:
 *                 type: object
 *                 properties:
 *                   id:
 *                     type: integer
 *                     example: 1
 *                   name:
 *                     type: string
 *                     example: "Plot XYZ"
 *                   category:
 *                     type: string
 *                     example: "Public"
 *                   accessibility_status:
 *                     type: string
 *                     example: "Accessible"
 *                   boundaries:
 *                     type: object
 *                     example: {}
 *                   label:
 *                     type: string
 *                     example: ""
 *                   acres_area:
 *                     type: number
 *                     example: 3.2
 *                   kml_file_link:
 *                     type: string
 *                     example: ""
 *                   total:
 *                     type: integer
 *                     example: 100
 *                   booked:
 *                     type: integer
 *                     example: 50
 *                   assigned:
 *                     type: integer
 *                     example: 30
 *                   available:
 *                     type: integer
 *                     example: 20
 *                   card_available:
 *                     type: integer
 *                     example: 10
 *       500:
 *         description: Internal server error
 *         schema:
 *           type: object
 *           properties:
 *             status:
 *               type: string
 *               example: "error"
 *             message:
 *               type: string
 *               example: "Something went wrong. Please try again after some time."
 */
routes.post('/corporate-stats', plot.getPlotStatesForCorporate);


/**
 * @swagger
 * /plots/corporate-analytics:
 *   get:
 *     summary: Get CSR trees analysis
 *     description: Fetches CSR trees analysis for a specific group.
 *     tags:
 *       - Plots
 *     parameters:
 *       - name: group_id
 *         in: query
 *         description: ID of the group
 *         required: false
 *         type: integer
 *         example: 1
 *     responses:
 *       200:
 *         description: CSR trees analysis fetched successfully
 *         schema:
 *           type: object
 *           properties:
 *             sponsored_trees:
 *               type: integer
 *               example: 100
 *             assigned_trees:
 *               type: integer
 *               example: 50
 *             plant_types:
 *               type: integer
 *               example: 10
 *             area:
 *               type: number
 *               example: 25.5
 *       500:
 *         description: Internal server error
 *         schema:
 *           type: object
 *           properties:
 *             status:
 *               type: string
 *               example: "error"
 *             message:
 *               type: string
 *               example: "Something went wrong. Please try again after some time."
 */
routes.get('/corporate-analytics', plot.getCSRTreesAnalysis);

export default routes;
