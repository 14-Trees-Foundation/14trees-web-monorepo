import express from 'express';
import * as donations from '../controllers/donationsController';

const routes = express.Router();


/**
 * @swagger
 * /donations/requests/get:
 *   post:
 *     summary: Get donation requests
 *     description: Fetches a list of donation requests with optional filters and sorting.
 *     tags:
 *       - Donations
 *     parameters:
 *       - in: body
 *         name: body
 *         description: Request body for fetching donation requests
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
 *         description: Donation requests fetched successfully
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
 *                 $ref: '#/definitions/Donation'
 *       500:
 *         description: Internal server error
 *         schema:
 *           type: object
 *           properties:
 *             message:
 *               type: string
 *               example: "Something went wrong. Please try again after some time"
 */
routes.post('/requests/get', donations.getDonations);


/**
 * @swagger
 * /donations/requests:
 *   post:
 *     summary: Create a new donation
 *     description: Creates a new donation with sponsor and tree plantation details.
 *     tags:
 *       - Donations
 *     parameters:
 *       - in: body
 *         name: body
 *         description: Request body for creating a donation
 *         required: true
 *         schema:
 *           type: object
 *           properties:
 *             sponsor_name:
 *               type: string
 *               example: "John Doe"
 *             sponsor_email:
 *               type: string
 *               example: "john.doe@example.com"
 *             sponsor_phone:
 *               type: string
 *               example: "1234567890"
 *             payment_id:
 *               type: string
 *               example: "PAY12345"
 *             category:
 *               $ref: '#/components/schemas/LandCategory'
 *             grove:
 *               type: string
 *               example: "Green Grove"
 *             grove_type_other:
 *               type: string
 *               example: "Custom Grove"
 *             trees_count:
 *               type: integer
 *               example: 10
 *             contribution_options:
 *               $ref: '#/components/schemas/ContributionOption'
 *             comments:
 *               type: string
 *               example: "This is a comment."
 *             users:
 *               type: array
 *               items:
 *                 type: object
 *                 properties:
 *                   recipient:
 *                     type: string
 *                     example: "Recipient Name"
 *                   assignee:
 *                     type: string
 *                     example: "Assignee Name"
 *                   count:
 *                     type: integer
 *                     example: 5
 *     responses:
 *       201:
 *         description: Donation created successfully
 *         schema:
 *           $ref: '#/definitions/Donation'
 *       400:
 *         description: Bad request
 *         schema:
 *           type: object
 *           properties:
 *             message:
 *               type: string
 *               example: "Invalid sponsor name or email. Please provide valid details!"
 *       500:
 *         description: Internal server error
 *         schema:
 *           type: object
 *           properties:
 *             message:
 *               type: string
 *               example: "Failed to create donation"
 */
routes.post('/' , donations.createDonation);
routes.delete('/:id' , donations.deleteDonation);
routes.put('/:id' , donations.updateDonation);
// routes.post('/work-order/:donation_id' , donations.createWorkOrder);
// routes.post('/update-feedback' , donations.updateFeedback);
// routes.post('/book-trees' , donations.bookTreesForDonation);
// routes.get('/users/:donation_id' , donations.getDonationUsers);
// routes.post('/emails/ack' , donations.sendAckMail);

export default routes;
