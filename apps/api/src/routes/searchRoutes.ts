import { Router } from 'express';
import * as search from '../controllers/searchController';

const routes = Router();

/**
 * @swagger
 * /search:
 *   get:
 *     summary: Search all resources
 *     description: Performs a global search across all searchable resources.
 *     tags:
 *       - Search
 *     parameters:
 *       - name: q
 *         in: query
 *         description: Search query string
 *         required: true
 *         type: string
 *         example: "tree"
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
 *         description: Search results fetched successfully
 *         schema:
 *           type: object
 *           properties:
 *             offset:
 *               type: integer
 *               example: 0
 *             total:
 *               type: integer
 *               example: 42
 *             results:
 *               type: array
 *               items:
 *                 type: object
 *                 properties:
 *                   type:
 *                     type: string
 *                     example: "tree"
 *                   id:
 *                     type: integer
 *                     example: 1
 *                   title:
 *                     type: string
 *                     example: "Oak Tree"
 *       400:
 *         description: Invalid search parameters
 *         schema:
 *           type: object
 *           properties:
 *             message:
 *               type: string
 *               example: "Search query is required"
 *       500:
 *         description: Internal server error
 *         schema:
 *           type: object
 *           properties:
 *             message:
 *               type: string
 *               example: "Failed to perform search"
 */
routes.get('/', search.getAll);

export default routes;
