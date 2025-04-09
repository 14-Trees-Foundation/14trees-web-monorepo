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
 *               $ref: '#/definitions/LandCategory'
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
 *               $ref: '#/definitions/ContributionOption'
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
routes.post('/requests' , donations.createDonation);
routes.delete('/requests/:id' , donations.deleteDonation);
routes.put('/requests/:id' , donations.updateDonation);
// routes.post('/work-order/:donation_id' , donations.createWorkOrder);
// routes.post('/update-feedback' , donations.updateFeedback);
// routes.post('/book-trees' , donations.bookTreesForDonation);
// routes.get('/users/:donation_id' , donations.getDonationUsers);
// routes.post('/emails/ack' , donations.sendAckMail);



/**
 * @swagger
 * /donations/users/get:
 *   post:
 *     summary: Get donation users
 *     description: Fetches a paginated list of users associated with donations based on filters.
 *     tags:
 *       - Donations
 *     parameters:
 *       - in: body
 *         name: body
 *         description: Request body for fetching donation users
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
 *                     example: "recipient_name"
 *                   operatorValue:
 *                     type: string
 *                     example: "equals"
 *                   value:
 *                     type: string
 *                     example: "John Doe"
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
 *         description: Donation users fetched successfully
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
 *                 $ref: '#/definitions/DonationUser'
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
 *               example: "Something went wrong. Please try again after some time!"
 */
routes.post('/users/get', donations.getDonationUsers);


/**
 * @swagger
 * /donations/users:
 *   put:
 *     summary: Update donation user
 *     description: Create or update a single donation user.
 *     tags:
 *       - Donations
 *     parameters:
 *       - in: body
 *         name: body
 *         description: Request body for creating or updating a donation user.
 *         required: true
 *         schema:
 *           type: object
 *           properties:
 *             donation_id:
 *               type: integer
 *               example: 1
 *             user:
 *               type: object
 *               properties:
 *                 id:
 *                   type: integer
 *                   example: 1
 *                 recipient:
 *                   type: integer
 *                   example: 1
 *                 assignee:
 *                   type: integer
 *                   example: 1
 *                 recipient_name:
 *                   type: string
 *                   example: "Recipient Name"
 *                 recipient_email:
 *                   type: string
 *                   format: email
 *                   example: "recipient@gmail.com"
 *                 recipient_phone:
 *                   type: string
 *                   example: "9876543210"
 *                 assignee_name:
 *                   type: string
 *                   example: "Assignee Name"
 *                 assignee_email:
 *                   type: string
 *                   format: email
 *                   example: "assignee@gmail.com"
 *                 assignee_phone:
 *                   type: string
 *                   example: "9876543210"
 *                 trees_count:
 *                   type: integer
 *                   example: 14
 *                 profile_image_url:
 *                   type: string
 *                   example: "https://bucket.ap-south-1.s3.aws.com/image.png"
 *     responses:
 *       200:
 *         description: Donation user updated successfully.
 *         schema:
 *           $ref: '#/definitions/DonationUser'
 *       400:
 *         description: Bad request
 *         schema:
 *           type: object
 *           properties:
 *             message:
 *               type: string
 *               example: "Invalid input provided!"
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
routes.put('/users', donations.updateDonationUser);



/**
 * @swagger
 * /donations/users/{donation_user_id}:
 *   delete:
 *     summary: Delete a donation user
 *     description: Deletes a specific donation user by their ID.
 *     tags:
 *       - Donations
 *     parameters:
 *       - name: donation_user_id
 *         in: path
 *         description: ID of the donation user to delete
 *         required: true
 *         type: integer
 *         example: 123
 *     responses:
 *       200:
 *         description: Donation user deleted successfully.
 *       400:
 *         description: Invalid donation user ID
 *         schema:
 *           type: object
 *           properties:
 *             message:
 *               type: string
 *               example: "Invalid donation user id"
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
routes.delete('/users/:donation_user_id', donations.deleteDonationUser);


/**
 * @swagger
 * /donations/trees/reserve:
 *   post:
 *     summary: Reserve trees for a donation
 *     description: Reserves trees for a donation either automatically or based on selected tree IDs.
 *     tags:
 *       - Donations
 *     parameters:
 *       - in: body
 *         name: body
 *         description: Request body for reserving trees for a donation
 *         required: true
 *         schema:
 *           type: object
 *           properties:
 *             donation_id:
 *               type: integer
 *               example: 123
 *             tree_ids:
 *               type: array
 *               items:
 *                 type: integer
 *               example: [1, 2, 3]
 *             auto_reserve:
 *               type: boolean
 *               example: true
 *             plots:
 *               type: array
 *               items:
 *                 type: integer
 *               example: [101, 102]
 *             diversify:
 *               type: boolean
 *               example: true
 *             book_all_habits:
 *               type: boolean
 *               example: false
 *     responses:
 *       200:
 *         description: Trees reserved successfully
 *       400:
 *         description: Bad request
 *         schema:
 *           type: object
 *           properties:
 *             message:
 *               type: string
 *               example: "Invalid input provided!"
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
 *               example: "Something went wrong. Please try again after some time!"
 */
routes.post('/trees/reserve', donations.reserveTreesForDonation)



/**
 * @swagger
 * /donations/trees/unreserve:
 *   post:
 *     summary: Unreserve trees for a donation
 *     description: Unreserves trees for a donation either by unreserving all trees or specific tree IDs.
 *     tags:
 *       - Donations
 *     parameters:
 *       - in: body
 *         name: body
 *         description: Request body for unreserving trees for a donation
 *         required: true
 *         schema:
 *           type: object
 *           properties:
 *             donation_id:
 *               type: integer
 *               example: 123
 *             tree_ids:
 *               type: array
 *               items:
 *                 type: integer
 *               example: [1, 2, 3]
 *             unreserve_all:
 *               type: boolean
 *               example: true
 *     responses:
 *       200:
 *         description: Trees unreserved successfully
 *       400:
 *         description: Bad request
 *         schema:
 *           type: object
 *           properties:
 *             message:
 *               type: string
 *               example: "Invalid input provided!"
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
 *               example: "Something went wrong. Please try again after some time!"
 */
routes.post('/trees/unreserve', donations.unreserveTreesForDonation)



/**
 * @swagger
 * /donations/trees/assign:
 *   post:
 *     summary: Assign trees for a donation
 *     description: Assigns trees to users for a specific donation. Trees can be assigned automatically or based on user input.
 *     tags:
 *       - Donations
 *     parameters:
 *       - in: body
 *         name: body
 *         description: Request body for assigning trees for a donation
 *         required: true
 *         schema:
 *           type: object
 *           properties:
 *             donation_id:
 *               type: integer
 *               example: 123
 *             auto_assign:
 *               type: boolean
 *               example: true
 *             user_trees:
 *               type: array
 *               items:
 *                 type: object
 *                 properties:
 *                   user_id:
 *                     type: integer
 *                     example: 1
 *                   tree_ids:
 *                     type: array
 *                     items:
 *                       type: integer
 *                     example: [101, 102, 103]
 *     responses:
 *       200:
 *         description: Trees assigned successfully
 *       400:
 *         description: Bad request
 *         schema:
 *           type: object
 *           properties:
 *             message:
 *               type: string
 *               example: "Invalid input provided!"
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
 *               example: "Something went wrong. Please try again later!"
 */
routes.post('/trees/assign', donations.assignTrees)



/**
 * @swagger
 * /donations/trees/unassign:
 *   post:
 *     summary: Unassign trees for a donation
 *     description: Unassigns all trees or specific trees for a given donation.
 *     tags:
 *       - Donations
 *     parameters:
 *       - in: body
 *         name: body
 *         description: Request body for unassigning trees for a donation
 *         required: true
 *         schema:
 *           type: object
 *           properties:
 *             donation_id:
 *               type: integer
 *               example: 123
 *     responses:
 *       200:
 *         description: Trees unassigned successfully
 *       400:
 *         description: Bad request
 *         schema:
 *           type: object
 *           properties:
 *             message:
 *               type: string
 *               example: "Donation Id required to unassign trees."
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
routes.post('/trees/unassign', donations.unassignTrees)


/**
 * @swagger
 * /gift-cards/trees/get:
 *   post:
 *     summary: Get reserved trees for donation
 *     description: Fetches trees booked for a gift card request.
 *     tags:
 *       - Donations
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
 *     responses:
 *       200:
 *         description: Reserved trees fetched successfully
 *         schema:
 *           type: object
 *           properties:
 *             offser:
 *               type: number
 *               example: 0
 *             total:
 *               type: number
 *               example: 20
 *             results:
 *               type: array
 *               items:
 *                 $ref: '#/definitions/DonationTree'
 *       400:
 *         description: Bad request
 *         schema:
 *           type: object
 *           properties:
 *             message:
 *               type: string
 *               example: "Please provide valid input details!"
 *       500:
 *         description: Internal server error
 *         schema:
 *           type: object
 *           properties:
 *             message:
 *               type: string
 *               example: "Something went wrong. Please try again later."
 */
routes.post('/trees/get', donations.getDonationTrees)

/**
 * @swagger
 * /donations/tags:
 *   get:
 *     summary: Get donation tags
 *     description: Fetches all unique tags used in donations
 *     tags:
 *       - Donations
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
 *     responses:
 *       200:
 *         description: Tags fetched successfully
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
 *                 type: string
 *       500:
 *         description: Internal server error
 */
routes.get('/tags', donations.getDonationTags);


export default routes;
