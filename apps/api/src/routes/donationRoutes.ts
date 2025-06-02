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
routes.post('/requests', donations.createDonation);

/**
 * @swagger
 * /donations/{id}/process:
 *   post:
 *     summary: Mark donation as processed
 *     description: Updates the donation record to mark it as processed by a backoffice user
 *     tags:
 *       - Donations
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         description: ID of the donation to process
 *         schema:
 *           type: integer
 *           example: 123
 *       - in: body
 *         name: body
 *         description: Backoffice user processing the donation
 *         required: true
 *         schema:
 *           type: object
 *           required:
 *             - userId
 *           properties:
 *             userId:
 *               type: integer
 *               description: ID of the backoffice user processing the request
 *               example: 45
 *     responses:
 *       200:
 *         description: Donation successfully marked as processed
 *         schema:
 *           type: object
 *           properties:
 *             success:
 *               type: boolean
 *               example: true
 *             processed_by:
 *               type: integer
 *               example: 45
 *       400:
 *         description: Bad request - missing or invalid parameters
 *         schema:
 *           type: object
 *           properties:
 *             message:
 *               type: string
 *               example: "User ID is required"
 *       404:
 *         description: Donation not found
 *         schema:
 *           type: object
 *           properties:
 *             message:
 *               type: string
 *               example: "Donation not found"
 *       409:
 *         description: Conflict - donation already processed
 *         schema:
 *           type: object
 *           properties:
 *             message:
 *               type: string
 *               example: "Already processed by user 32"
 *             processed_by:
 *               type: integer
 *               example: 32
 *       500:
 *         description: Internal server error
 *         schema:
 *           type: object
 *           properties:
 *             message:
 *               type: string
 *               example: "Failed to process donation"
 */
routes.post('/:id/process', donations.processDonation);


routes.post('/requests/payment-success', donations.paymentSuccessForDonation);

routes.post('/requests/auto-process', donations.autoProcessDonationRequest);

routes.delete('/requests/:id', donations.deleteDonation);
routes.put('/requests/:id', donations.updateDonation);
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
 * /donations/trees/map:
 *   post:
 *     summary: Map assigned trees for a donation
 *     description: Map already assigned trees to donation
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
 *     responses:
 *       200:
 *         description: Trees mapped successfully
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
routes.post('/trees/map', donations.mapAssignedTreesToDonation)

/**
 * @swagger
 * /donations/trees/unmap:
 *   post:
 *     summary: Unmap trees from a donation
 *     description: Remove association between trees and a donation
 *     tags:
 *       - Donations
 *     parameters:
 *       - in: body
 *         name: body
 *         description: Request body for unmapping trees from a donation
 *         required: true
 *         schema:
 *           type: object
 *           properties:
 *             donation_id:
 *               type: integer
 *               description: ID of the donation to unmap trees from
 *               example: 123
 *             tree_ids:
 *               type: array
 *               items:
 *                 type: integer
 *               description: Array of tree IDs to unmap
 *               example: [1, 2, 3]
 *     responses:
 *       200:
 *         description: Trees unmapped successfully
 *         schema:
 *           $ref: '#/definitions/Donation'
 *       400:
 *         description: Bad request
 *         schema:
 *           type: object
 *           properties:
 *             message:
 *               type: string
 *               example: "Invalid input provided!"
 *       404:
 *         description: Not found
 *         schema:
 *           type: object
 *           properties:
 *             message:
 *               type: string
 *               example: "Donation or trees not found"
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
routes.post('/trees/unmap', donations.unmapAssignedTreesFromDonation)

/**
 * @swagger
 * /donations/trees/mapped:
 *   post:
 *     summary: Get trees mapped to a donation
 *     description: Retrieve all trees currently mapped to a specific donation
 *     tags:
 *       - Donations
 *     parameters:
 *       - in: body
 *         name: body
 *         description: Request body containing donation ID and optional filters
 *         required: true
 *         schema:
 *           type: object
 *           properties:
 *             donation_id:
 *               type: integer
 *               example: 123
 *             offset:
 *               type: integer
 *               example: 0
 *             limit:
 *               type: integer
 *               example: 20
 *             filters:
 *               type: array
 *               items:
 *                 type: object
 *                 properties:
 *                   columnField:
 *                     type: string
 *                     example: "sapling_id"
 *                   operatorValue:
 *                     type: string
 *                     example: "contains"
 *                   value:
 *                     type: string
 *                     example: "ABC"
 *             orderBy:
 *               type: array
 *               items:
 *                 type: object
 *                 properties:
 *                   column:
 *                     type: string
 *                     example: "sapling_id"
 *                   order:
 *                     type: string
 *                     enum: [ASC, DESC]
 *                     example: "ASC"
 *     responses:
 *       200:
 *         description: List of mapped trees
 *         schema:
 *           type: object
 *           properties:
 *             total:
 *               type: integer
 *             results:
 *               type: array
 *               items:
 *                 $ref: '#/definitions/Tree'
 *       400:
 *         description: Missing or invalid input
 *       500:
 *         description: Internal server error
 */
routes.post('/trees/getmapped', donations.getMappedTreesByDonation);



/**
 * @swagger
 * /donations/trees/stats:
 *   get:
 *     summary: Get reservation stats for a donation
 *     description: Fetches the reservation stats for a specific donation
 *     tags:
 *       - Donations
 *     parameters:
 *       - name: donation_id
 *         in: query            
 *         description: ID of the donation to fetch stats for
 *         required: true
 *         type: integer
 *         example: 123
 *     responses:
 *       200:           
 *         description: Reservation stats fetched successfully
 *         schema:
 *           type: object
 *           properties:
 *             total_requested:
 *               type: integer
 *               example: 100           
 *             already_reserved:
 *               type: integer
 *               example: 50
 *             remaining:
 *               type: integer
 *               example: 50            
 *       400:
 *         description: Bad request
 *         schema:
 *           type: object
 *           properties:
 *             message:
 *               type: string
 *               example: "Invalid donation ID"     
 *       500:
 *         description: Internal server error
 *         schema:
 *           type: object
 *           properties:
 *             message:
 *               type: string
 *               example: "Something went wrong. Please try again after some time!"
 */
routes.get('/trees/stats', donations.getDonationReservationStats);

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

/**
 * @swagger
 * /donations/emails/send:
 *   post:
 *     summary: Send email for a donation
 *     description: Sends email notifications for a donation with optional test emails and CC recipients.
 *     tags:
 *       - Donations
 *     parameters:
 *       - in: body
 *         name: body
 *         description: Request body for sending donation email
 *         required: true
 *         schema:
 *           type: object
 *           properties:
 *             donation_id:
 *               type: integer
 *               example: 123
 *             test_mails:
 *               type: array
 *               items:
 *                 type: string
 *               example: ["test@example.com"]
 *             sponsor_cc_mails:
 *               type: array
 *               items:
 *                 type: string
 *               example: ["cc@example.com"]
 *             event_type:
 *               type: string
 *               example: "default"
 *     responses:
 *       200:
 *         description: Email sent successfully
 *       400:
 *         description: Bad request
 *         schema:
 *           type: object
 *           properties:
 *             error:
 *               type: string
 *               example: "Donation ID is required"
 *       404:
 *         description: Not found
 *         schema:
 *           type: object
 *           properties:
 *             error:
 *               type: string
 *               example: "Donation not found"
 *       500:
 *         description: Internal server error
 *         schema:
 *           type: object
 *           properties:
 *             error:
 *               type: string
 *               example: "Internal server error"
 */
routes.post('/emails/send', donations.sendEmailForDonation);

export default routes;
