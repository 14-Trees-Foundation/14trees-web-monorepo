import express from 'express';
import * as group from '../controllers/groupController';
import uploadFiles from "../helpers/multer";

const routes = express.Router();

routes.get('/:search', group.searchGroups);


/**
 * @swagger
 * /groups/get:
 *   post:
 *     summary: Get groups
 *     description: Fetches a list of groups with optional filters.
 *     tags:
 *       - Groups
 *     parameters:
 *       - in: body
 *         name: body
 *         description: Request body for fetching groups
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
 *                     example: "name"
 *                   operatorValue:
 *                     type: string
 *                     example: "contains"
 *                   value:
 *                     type: string
 *                     example: "Foundation"
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
 *         description: Groups fetched successfully
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
 *                 $ref: '#/definitions/Group'
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
routes.post('/get', group.getGroups);


/**
 * @swagger
 * /groups:
 *   post:
 *     summary: Add a new group
 *     description: Adds a new group to the system.
 *     tags:
 *       - Groups
 *     consumes:
 *       - multipart/form-data
 *     parameters:
 *       - in: formData
 *         name: name
 *         description: Name of the group
 *         required: true
 *         type: string
 *         example: "Foundation Group"
 *       - in: formData
 *         name: type
 *         description: Type of the group
 *         required: true
 *         type: string
 *         example: "Corporate"
 *       - in: formData
 *         name: description
 *         description: Description of the group
 *         required: false
 *         type: string
 *         example: "A group for foundation members"
 *       - in: formData
 *         name: address
 *         description: Corporate address
 *         required: false
 *         type: string
 *       - in: formData
 *         name: logo
 *         description: Logo file for the group
 *         required: false
 *         type: file
 *     responses:
 *       201:
 *         description: Group created successfully
 *         schema:
 *           $ref: '#/definitions/Group'
 *       400:
 *         description: Bad request
 *         schema:
 *           type: object
 *           properties:
 *             error:
 *               type: string
 *               example: "Group name is required"
 *       500:
 *         description: Internal server error
 *         schema:
 *           type: object
 *           properties:
 *             error:
 *               type: string
 *               example: "Something went wrong. Please try again later."
 */
routes.post('/', uploadFiles.fields([{name: 'logo', maxCount: 1 }]), group.addGroup);


/**
 * @swagger
 * /groups/{id}:
 *   put:
 *     summary: Update group
 *     description: Updates an existing group.
 *     tags:
 *       - Groups
 *     consumes:
 *       - multipart/form-data
 *     parameters:
 *       - in: formData
 *         name: logo
 *         description: Logo file for the group
 *         required: false
 *         type: file
 *       - in: body
 *         name: body
 *         description: Request body for updating a group
 *         required: true
 *         schema:
 *           $ref: '#/definitions/Group'
 *     responses:
 *       201:
 *         description: Group updated successfully
 *         schema:
 *           $ref: '#/definitions/Group'
 *       500:
 *         description: Internal server error
 *         schema:
 *           type: object
 *           properties:
 *             error:
 *               type: string
 *               example: "Something went wrong. Please try again later."
 */
routes.put('/:id', uploadFiles.fields([{name: 'logo', maxCount: 1 }]), group.updateGroup);


/**
 * @swagger
 * /groups/{id}:
 *   delete:
 *     summary: Delete group
 *     description: Deletes a group by its ID.
 *     tags:
 *       - Groups
 *     parameters:
 *       - name: id
 *         in: path
 *         description: ID of the group to delete
 *         required: true
 *         type: integer
 *         example: 1
 *     responses:
 *       200:
 *         description: Group deleted successfully
 *         schema:
 *           type: object
 *           properties:
 *             message:
 *               type: string
 *               example: "Group deleted successfully"
 *       400:
 *         description: Bad request
 *         schema:
 *           type: object
 *           properties:
 *             error:
 *               type: string
 *               example: "Invalid group ID"
 *       500:
 *         description: Internal server error
 *         schema:
 *           type: object
 *           properties:
 *             error:
 *               type: string
 *               example: "Something went wrong. Please try again later."
 */
routes.delete('/:id', group.deleteGroup);


/**
 * @swagger
 * /groups/merge:
 *   post:
 *     summary: Merge groups
 *     description: Merges two groups into one.
 *     tags:
 *       - Groups
 *     parameters:
 *       - in: body
 *         name: body
 *         description: Request body for merging groups
 *         required: true
 *         schema:
 *           type: object
 *           properties:
 *             primary_group:
 *               type: integer
 *               example: 1
 *             secondary_group:
 *               type: integer
 *               example: 2
 *             delete_secondary:
 *               type: boolean
 *               example: true
 *     responses:
 *       200:
 *         description: Groups merged successfully
 *       500:
 *         description: Internal server error
 *         schema:
 *           type: object
 *           properties:
 *             message:
 *               type: string
 *               example: "Something went wrong. Please try again after some time!"
 */
routes.post('/merge', group.mergeGroups);


export default routes;
