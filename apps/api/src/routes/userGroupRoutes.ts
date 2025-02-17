import express from 'express';
import * as userGroup from '../controllers/userGroupController';
import uploadFiles from "../helpers/multer";

const routes = express.Router();


/**
 * @swagger
 * /user-groups:
 *   get:
 *     summary: Get user group
 *     description: Fetches a user group by user ID and group ID.
 *     tags:
 *       - Groups
 *     parameters:
 *       - name: user_id
 *         in: query
 *         description: ID of the user
 *         required: true
 *         type: integer
 *         example: 1
 *       - name: group_id
 *         in: query
 *         description: ID of the group
 *         required: true
 *         type: integer
 *         example: 1
 *     responses:
 *       200:
 *         description: User group fetched successfully
 *         schema:
 *           $ref: '#/definitions/UserGroup'
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
routes.get('/', userGroup.getUserGroup);


/**
 * @swagger
 * /user-groups:
 *   post:
 *     summary: Add user to group
 *     description: Adds a user to a group. If the user does not exist, creates a new user.
 *     tags:
 *       - Groups
 *     parameters:
 *       - in: body
 *         name: body
 *         description: Request body for adding a user to a group
 *         required: true
 *         schema:
 *           type: object
 *           properties:
 *             group_id:
 *               type: integer
 *               example: 1
 *             user_id:
 *               type: integer
 *               example: 1
 *             name:
 *               type: string
 *               example: "John Doe"
 *             email:
 *               type: string
 *               example: "john.doe@example.com"
 *             phone:
 *               type: string
 *               example: "1234567890"
 *     responses:
 *       201:
 *         description: User added to group successfully
 *         schema:
 *           $ref: '#/definitions/UserGroup'
 *       400:
 *         description: Bad request
 *         schema:
 *           type: object
 *           properties:
 *             error:
 *               type: string
 *               example: "group_id is required"
 *       409:
 *         description: Conflict
 *         schema:
 *           type: object
 *           properties:
 *             message:
 *               type: string
 *               example: "UserGroup already exists"
 *       500:
 *         description: Internal server error
 *         schema:
 *           type: object
 *           properties:
 *             error:
 *               type: string
 *               example: "Something went wrong. Please try again later."
 */
routes.post('/', userGroup.addUserGroup);


/**
 * @swagger
 * /user-groups/bulk:
 *   post:
 *     summary: Add users to group in bulk
 *     description: Adds multiple users to a group using a CSV file. If a user does not exist, creates a new user.
 *     tags:
 *       - Groups
 *     consumes:
 *       - multipart/form-data
 *     parameters:
 *       - in: formData
 *         name: file
 *         description: CSV file containing user data
 *         required: true
 *         type: file
 *       - in: formData
 *         name: group_id
 *         description: ID of the group
 *         required: true
 *         type: integer
 *         example: 1
 *     responses:
 *       201:
 *         description: Users added to group successfully
 *         schema:
 *           type: object
 *           properties:
 *             success:
 *               type: integer
 *               example: 10
 *             failed:
 *               type: integer
 *               example: 2
 *             failed_records:
 *               type: array
 *               items:
 *                 type: object
 *                 properties:
 *                   email:
 *                     type: string
 *                     example: "failed@example.com"
 *                   error:
 *                     type: string
 *                     example: "Failed to create user"
 *                   status:
 *                     type: string
 *                     example: "error"
 *       400:
 *         description: Bad request
 *         schema:
 *           type: object
 *           properties:
 *             error:
 *               type: string
 *               example: "Group id is required"
 *       404:
 *         description: Group not found
 *         schema:
 *           type: object
 *           properties:
 *             error:
 *               type: string
 *               example: "Group not found"
 *       500:
 *         description: Internal server error
 *         schema:
 *           type: object
 *           properties:
 *             error:
 *               type: string
 *               example: "Something went wrong. Please try again later."
 */
routes.post('/bulk', uploadFiles.single('file'), userGroup.addUserGroupsBulk);


/**
 * @swagger
 * /user-groups:
 *   delete:
 *     summary: Delete users from group
 *     description: Deletes multiple users from a group.
 *     tags:
 *       - Groups
 *     parameters:
 *       - in: body
 *         name: body
 *         description: Request body for deleting users from a group
 *         required: true
 *         schema:
 *           type: object
 *           properties:
 *             user_ids:
 *               type: array
 *               items:
 *                 type: integer
 *               example: [1, 2, 3]
 *             group_id:
 *               type: integer
 *               example: 1
 *     responses:
 *       200:
 *         description: Group users deleted successfully
 *         schema:
 *           type: object
 *           properties:
 *             message:
 *               type: string
 *               example: "Group users deleted successfully"
 *       400:
 *         description: Bad request
 *         schema:
 *           type: object
 *           properties:
 *             error:
 *               type: string
 *               example: "user_ids and group_id are required"
 *       500:
 *         description: Internal server error
 *         schema:
 *           type: object
 *           properties:
 *             error:
 *               type: string
 *               example: "Something went wrong. Please try again later."
 */
routes.delete('/', userGroup.deleteGroupUsers);

export default routes;
