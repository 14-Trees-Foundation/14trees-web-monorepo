import { Router } from 'express';
import * as users from '../controllers/usersController';
import uploadFiles from "../helpers/multer";

const routes = Router();

routes.get('/', users.getUser);
routes.post('/get', users.getUsers);


/**
 * @swagger
 * /users/{search}:
 *   get:
 *     summary: Search users
 *     description: Searches for users based on a search term.
 *     tags:
 *       - Users
 *     parameters:
 *       - name: search
 *         in: path
 *         description: Search term (at least 3 characters)
 *         required: true
 *         type: string
 *         example: "John"
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
 *         description: Users fetched successfully
 *         schema:
 *           type: array
 *           items:
 *             $ref: '#/definitions/User'
 *       400:
 *         description: Bad request
 *         schema:
 *           type: object
 *           properties:
 *             error:
 *               type: string
 *               example: "Please provide at least 3 char to search"
 *       500:
 *         description: Internal server error
 *         schema:
 *           type: object
 *           properties:
 *             error:
 *               type: string
 *               example: "Something went wrong. Please try again later."
 */
routes.get('/:search', users.searchUsers);


/**
 * @swagger
 * /users:
 *   post:
 *     summary: Add a new user
 *     description: Adds a new user to the system.
 *     tags:
 *       - Users
 *     parameters:
 *       - in: body
 *         name: body
 *         description: Request body for adding a new user
 *         required: true
 *         schema:
 *           type: object
 *           properties:
 *             name:
 *               type: string
 *               example: "John Doe"
 *             email:
 *               type: string
 *               example: "john.doe@example.com"
 *             phone:
 *               type: string
 *               example: "9876543210"
 *             birth_date:
 *               type: string
 *               example: "1990-01-01"
 *             communication_email:
 *               type: string
 *               example: "john.doe.2@example.com"
 *     responses:
 *       201:
 *         description: User created successfully
 *         schema:
 *           $ref: '#/definitions/User'
 *       400:
 *         description: Bad request
 *         schema:
 *           type: object
 *           properties:
 *             status:
 *               type: string
 *               example: "error"
 *             message:
 *               type: string
 *               example: "User name is required"
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
routes.post('/', users.addUser);
routes.post('/bulk', uploadFiles.single('file'),users.addUsersBulk);
routes.put('/:id', users.updateUser);
routes.delete('/:id', users.deleteUser);
routes.post("/combine", users.combineUsers);

export default routes;