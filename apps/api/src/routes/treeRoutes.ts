import { Router } from "express";
import * as trees from "../controllers/treesController";
import uploadFiles from "../helpers/multer";

const routes = Router();

// @deprecated
routes.post('/addtree', uploadFiles.array('files', 1), trees.addTree);


/**
 * @swagger
 * /trees/get:
 *   post:
 *     summary: Get trees
 *     description: Fetches a list of trees with optional filters and sorting.
 *     tags:
 *       - Trees
 *     parameters:
 *       - in: body
 *         name: body
 *         description: Request body for fetching trees
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
 *         description: Trees fetched successfully
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
 *                 #ref: '#/definitions/Tree'
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
routes.post('/get', trees.getTrees);


/**
 * @swagger
 * /trees:
 *   post:
 *     summary: Add a new tree
 *     description: Adds a new tree to the system.
 *     tags:
 *       - Trees
 *     parameters:
 *       - in: body
 *         name: body
 *         description: Request body for adding a new tree
 *         required: true
 *         schema:
 *           type: object
 *           properties:
 *             sapling_id:
 *               type: string
 *               example: "S12345"
 *             plant_type_id:
 *               type: integer
 *               example: 1
 *             plot_id:
 *               type: integer
 *               example: 1
 *             image:
 *               type: string
 *               example: "file.png"
 *             lat:
 *               type: number
 *               example: 12.345678
 *             lng:
 *               type: number
 *               example: 98.765432
 *             tags:
 *               type: array
 *               items:
 *                 type: string
 *               example: ["tag1", "tag2"]
 *             mapped_to:
 *               type: integer
 *               example: 1
 *     responses:
 *       201:
 *         description: Tree created successfully
 *         schema:
 *           $ref: '#/definitions/Tree'
 *       500:
 *         description: Internal server error
 *         schema:
 *           type: object
 *           properties:
 *             error:
 *               type: string
 *               example: "Something went wrong. Please try again later."
 */
routes.post('/', uploadFiles.array('files', 1), trees.addTree);


/**
 * @swagger
 * /trees/{id}:
 *   put:
 *     summary: Update tree
 *     description: Updates an existing tree record.
 *     tags:
 *       - Trees
 *     parameters:
 *       - in: body
 *         name: body
 *         description: Request body for updating a tree
 *         required: true
 *         schema:
 *           type: object
 *           properties:
 *             id:
 *               type: integer
 *               example: 1
 *             sapling_id:
 *               type: string
 *               example: "S12345"
 *             plant_type_id:
 *               type: integer
 *               example: 1
 *             plot_id:
 *               type: integer
 *               example: 1
 *             image:
 *               type: string
 *               example: "https://example.com/tree.jpg"
 *             status:
 *               type: string
 *               example: "system_invalidated"
 *             status_message:
 *               type: string
 *               example: "Tree is not healthy"
 *             lat:
 *               type: number
 *               example: 12.345678
 *             lng:
 *               type: number
 *               example: 98.765432
 *             tags:
 *               type: array
 *               items:
 *                 type: string
 *               example: ["tag1", "tag2"]
 *             mapped_to:
 *               type: integer
 *               example: 1
 *     responses:
 *       200:
 *         description: Tree updated successfully
 *         schema:
 *           $ref: '#/definitions/Tree'
 *       404:
 *         description: Tree not found
 *         schema:
 *           type: object
 *           properties:
 *             message:
 *               type: string
 *               example: "Tree not found"
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
 *               example: "Something went wrong. Please try again later."
 */
routes.put('/:id', uploadFiles.array('files', 1), trees.updateTree);


/**
 * @swagger
 * /trees/{id}:
 *   delete:
 *     summary: Delete tree
 *     description: Deletes a tree by its ID.
 *     tags:
 *       - Trees
 *     parameters:
 *       - name: id
 *         in: path
 *         description: ID of the tree to delete
 *         required: true
 *         type: integer
 *         example: 1
 *     responses:
 *       200:
 *         description: Tree deleted successfully
 *         schema:
 *           type: object
 *           properties:
 *             message:
 *               type: string
 *               example: "Tree deleted successfully"
 *       404:
 *         description: Tree not found
 *         schema:
 *           type: object
 *           properties:
 *             error:
 *               type: string
 *               example: "Tree not found"
 *       500:
 *         description: Internal server error
 *         schema:
 *           type: object
 *           properties:
 *             error:
 *               type: string
 *               example: "Something went wrong. Please try again later."
 */
routes.delete('/:id', uploadFiles.array('files', 1), trees.deleteTree);


/**
 * @swagger
 * /trees/change-plot:
 *   put:
 *     summary: Change trees plot
 *     description: Changes the plot of multiple trees.
 *     tags:
 *       - Trees
 *     parameters:
 *       - in: body
 *         name: body
 *         description: Request body for changing trees plot
 *         required: true
 *         schema:
 *           type: object
 *           properties:
 *             tree_ids:
 *               type: array
 *               items:
 *                 type: integer
 *               example: [1, 2, 3]
 *             plot_id:
 *               type: integer
 *               example: 1
 *     responses:
 *       200:
 *         description: Trees plot changed successfully
 *       500:
 *         description: Internal server error
 *         schema:
 *           type: object
 *           properties:
 *             error:
 *               type: string
 *               example: "Something went wrong. Please try again after some time."
 */
routes.post('/change-plot', trees.changeTreesPlot);


/**
 * @swagger
 * /trees/get-giftable:
 *   post:
 *     summary: Get giftable trees
 *     description: Fetches a list of giftable trees with optional filters.
 *     tags:
 *       - Trees
 *     parameters:
 *       - in: body
 *         name: body
 *         description: Request body for fetching giftable trees
 *         required: false
 *         schema:
 *           type: object
 *           properties:
 *             filters:
 *               type: array
 *               items:
 *                 type: object
 *                 properties:
 *                   columnField:
 *                     type: string
 *                     example: "species"
 *                   operatorValue:
 *                     type: string
 *                     example: "equals"
 *                   value:
 *                     type: string
 *                     example: "Oak"
 *             include_no_giftable:
 *               type: boolean
 *               example: false
 *             include_all_habits:
 *               type: boolean
 *               example: false
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
 *         description: Giftable trees fetched successfully
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
 *                 $ref: '#/definitions/GiftableTree'
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
routes.post('/get-giftable', trees.getGiftableTrees);


/**
 * @swagger
 * /trees/tags:
 *   get:
 *     summary: Get tree tags
 *     description: Fetches a list of unique tree tags.
 *     tags:
 *       - Trees
 *     responses:
 *       200:
 *         description: Tree tags fetched successfully
 *         schema:
 *           type: object
 *           properties:
 *             offset:
 *               type: integer
 *               example: 0
 *             total:
 *               type: integer
 *               example: 100
 *             results:
 *               type: array
 *               items:
 *                 type: string
 *                 example: "tag1"
 *       500:
 *         description: Internal server error
 *         schema:
 *           type: object
 *           properties:
 *             message:
 *               type: string
 *               example: "Something went wrong. Please try again after some time"
 */
routes.get('/tags', trees.getTreeTags);

// // the below route should be /get-tree-by-mongo-id or /get-tree-by-id
routes.get("/getsaplingid", trees.getTreeFromId);

// // the below route should be /get-tree-by-sapling-id
routes.get('/gettree', trees.getTree);
routes.get("/groupbyplots", trees.treeCountByPlot);
routes.get("/loggedbydate", trees.treeLoggedByDate);
routes.get("/treelogbyuser", trees.treeLogByUser);
routes.get("/treelogbyplot", trees.treeLogByPlot);
routes.get("/treetypecount", trees.treeCountTreeType);
routes.get("/treetypecount/plotwise", trees.treeTypeCountByPlot);


/**
 * @swagger
 * /trees/assigned/{user_id}:
 *   get:
 *     summary: Get assigned trees
 *     description: Fetches trees assigned to a specific user.
 *     tags:
 *       - Trees
 *     parameters:
 *       - name: user_id
 *         in: path
 *         description: ID of the user
 *         required: true
 *         type: integer
 *         example: 1
 *     responses:
 *       200:
 *         description: Assigned trees fetched successfully
 *         schema:
 *           type: array
 *           items:
 *             type: object
 *             properties:
 *               sapling_id:
 *                 type: string
 *                 example: "S12345"
 *               plant_type:
 *                 type: string
 *                 example: "Oak"
 *               created_at:
 *                 type: string
 *                 format: date-time
 *                 example: "2023-10-01T12:34:56Z"
 *               image:
 *                 type: string
 *                 example: "https://example.com/tree.jpg"
 *       400:
 *         description: Invalid User ID
 *         schema:
 *           type: object
 *           properties:
 *             status:
 *               type: string
 *               example: "bad"
 *             message:
 *               type: string
 *               example: "Invalid User ID!"
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
routes.get("/assigned/:user_id", trees.getAssignedTrees);


/**
 * @swagger
 * /trees/mapped/{user_id}:
 *   get:
 *     summary: Get mapped trees for user
 *     description: Fetches a list of trees which are mapped to/reserved for user
 *     tags:
 *       - Trees
 *     parameters:
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
 *       - name: user_id
 *         in: path
 *         description: ID of the user
 *         required: true
 *         type: integer
 *         example: 1
 *     responses:
 *       200:
 *         description: Trees fetched successfully
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
 *                 #ref: '#/definitions/Tree'
 *       400:
 *         description: Invalid User ID
 *         schema:
 *           type: object
 *           properties:
 *             status:
 *               type: string
 *               example: "bad"
 *             message:
 *               type: string
 *               example: "Invalid User ID!"
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
routes.get("/mapped/:user_id", trees.getMappedTreesForUser);
// routes.get("/plot/count", trees.countByPlot);
// routes.get("/plot/list", trees.treeListByPlot);
// routes.post('/update/photo', uploadFiles.array('files', 1), trees.addPhotoUpdate);

routes.post("/get-trees-plantation-info", trees.getTreePlantationsInfo);
routes.get("/count/user/:user_id", trees.getTreesCountForUser);
routes.get("/corporate-stats/tree-logged", trees.treePlantedByCorporate);
routes.post("/mapped-gift/get", trees.getMappedGiftTrees);
routes.post("/mapped-gift/analytics", trees.getMappedGiftTreesAnalytics);

export default routes;
