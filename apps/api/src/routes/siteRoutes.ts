import express from 'express';
import * as sites from '../controllers/siteController';
import uploadFiles from "../helpers/multer";

const routes = express.Router();


/**
 * @swagger
 * /sites/get:
 *   post:
 *     summary: Get sites
 *     description: Fetches a list of sites with optional filters.
 *     tags:
 *       - Sites
 *     parameters:
 *       - in: body
 *         name: body
 *         description: Request body for fetching sites
 *         required: false
 *         schema:
 *           type: object
 *           properties:
 *             filters:
 *               type: array
 *               items:
 *                 #ref: '#/definitions/Filter'
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
 *         description: Sites fetched successfully
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
 *                 $ref: '#/definitions/Site'
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
routes.post('/get', sites.getSites);



routes.post('/', uploadFiles.single("file"), sites.addSite);
routes.put('/:id',uploadFiles.single("file"), sites.updateSite);
routes.delete('/:id', sites.deleteSite);


/**
 * @swagger
 * /sites/sync-sites:
 *   post:
 *     summary: Sync sites data from Notion
 *     description: Syncs sites data from Notion and updates the database.
 *     tags:
 *       - Sites
 *     responses:
 *       200:
 *         description: Sites data synced successfully
 *       500:
 *         description: Internal server error
 *         schema:
 *           type: object
 *           properties:
 *             error:
 *               type: string
 *               example: "Something went wrong!"
 */
routes.post('/sync-sites', sites.syncSitesDatFromNotion);


/**
 * @swagger
 * /sites/stats:
 *   post:
 *     summary: Get tree counts for sites
 *     description: Fetches tree counts for sites with optional filters and sorting.
 *     tags:
 *       - Sites
 *     parameters:
 *       - in: body
 *         name: body
 *         description: Request body for fetching tree counts for sites
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
 *         description: Tree counts for sites fetched successfully
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
 *                 allOf:
 *                   - type: object
 *                     properties:
 *                       id:
 *                         type: integer
 *                         example: 100
 *                       site_name:
 *                         type: string
 *                         example: "Site ABC"
 *                       land_type:
 *                         type: string
 *                         example: ""
 *                       category:
 *                         type: string
 *                         example: ""
 *                       maintenance_type:
 *                         type: string
 *                         example: ""
 *                       district:
 *                         type: string
 *                         example: ""
 *                       taluka:
 *                         type: string
 *                         example: ""
 *                       village:
 *                         type: string
 *                         example: ""
 *                       kml_file_link:
 *                         type: string
 *                         example: ""
 *                       tags:
 *                         type: array
 *                         items:
 *                           type: string
 *                         example: ["Tag 1", "Tag 2"]
 *                   - $ref: '#/definitions/TreeAggCount'
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
routes.post('/stats', sites.getTreeCountsForSites);


/**
 * @swagger
 * /sites/stats/{field}:
 *   post:
 *     summary: Get trees count for field
 *     description: Fetches trees count for a specific field with optional filters and sorting.
 *     tags:
 *       - Sites
 *     parameters:
 *       - name: field
 *         in: path
 *         description: Field to get trees count for
 *         required: true
 *         type: string
 *         example: "category"
 *       - in: body
 *         name: body
 *         description: Request body for fetching trees count for field
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
 *         description: Trees count for field fetched successfully
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
 *                 allOf:
 *                   - type: object
 *                     properties:
 *                       [field]:
 *                         type: string
 *                         example: ""
 *                       category:
 *                         type: string
 *                         example: ""
 *                   - $ref: '#/definitions/TreeAggCount'
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
routes.post('/stats/:field', sites.getTreesCountForField);


/**
 * @swagger
 * /sites/districts:
 *   get:
 *     summary: Get districts data
 *     description: Fetches distinct district, taluka, and village data.
 *     tags:
 *       - Sites
 *     responses:
 *       200:
 *         description: Districts data fetched successfully
 *         schema:
 *           type: array
 *           items:
 *             type: object
 *             properties:
 *               district:
 *                 type: string
 *                 example: "District A"
 *               taluka:
 *                 type: string
 *                 example: "Taluka B"
 *               village:
 *                 type: string
 *                 example: "Village C"
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
routes.get('/districts', sites.getDistrictsData);


/**
 * @swagger
 * /sites/tags:
 *   post:
 *     summary: Get tree counts for tags
 *     description: Fetches tree counts for tags with optional filters and sorting.
 *     tags:
 *       - Sites
 *     parameters:
 *       - in: body
 *         name: body
 *         description: Request body for fetching tree counts for tags
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
 *         description: Tree counts for tags fetched successfully
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
 *                 allOf:
 *                   - type: object
 *                     properties:
 *                       tag:
 *                         type: string
 *                         example: "Tag1"
 *                   - $ref: '#/definitions/TreeAggCount'
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
routes.post('/tags', sites.getTreeCountsForTags);


/**
 * @swagger
 * /sites/corporate/{groupId}:
 *   get:
 *     summary: Get corporate tree distribution
 *     description: Fetches tree distribution for a specific corporate group.
 *     tags:
 *       - Sites
 *     parameters:
 *       - name: groupId
 *         in: path
 *         description: ID of the corporate group
 *         required: true
 *         type: integer
 *         example: 1
 *     responses:
 *       200:
 *         description: Corporate tree distribution fetched successfully
 *         schema:
 *           type: array
 *           items:
 *             type: object
 *             properties:
 *               plot_id:
 *                 type: integer
 *                 example: 1
 *               plot_name:
 *                 type: string
 *                 example: "Plot ABC"
 *               site_id:
 *                 type: integer
 *                 example: 1
 *               site_name:
 *                 type: string
 *                 example: "Site ABC"
 *               booked:
 *                 type: integer
 *                 example: 50
 *               available:
 *                 type: integer
 *                 example: 20
 *               total:
 *                 type: integer
 *                 example: 100
 *               assigned:
 *                 type: integer
 *                 example: 30
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
routes.get('/corporate/:groupId', sites.getCorporateTreeDistribution);


/**
 * @swagger
 * /sites/corporate-stats:
 *   post:
 *     summary: Get site states for corporate
 *     description: Fetches site states for corporate with optional filters and sorting.
 *     tags:
 *       - Sites
 *     parameters:
 *       - in: body
 *         name: body
 *         description: Request body for fetching site states for corporate
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
 *         description: Site states for corporate fetched successfully
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
 *                 type: object
 *                 properties:
 *                   id:
 *                     type: integer
 *                     example: 1
 *                   name_english:
 *                     type: string
 *                     example: "Site A"
 *                   tags:
 *                     type: array
 *                     items:
 *                       type: string
 *                     example: ["Tag A", "Tag B"]
 *                   kml_file_link:
 *                     type: string
 *                     example: ""
 *                   area_acres:
 *                     type: number
 *                     example: 4.2
 *                   total:
 *                     type: integer
 *                     example: 100
 *                   booked:
 *                     type: integer
 *                     example: 50
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
routes.post('/corporate-stats', sites.getSiteStatesForCorporate);


export default routes;
