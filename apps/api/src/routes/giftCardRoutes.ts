import { Router } from 'express';
import * as giftCards from '../controllers/giftCardController';
import * as transactions from '../controllers/transactionsController';
import uploadFiles from "../helpers/multer";

const routes = Router();

/**
 * @swagger
 * /gift-cards/requests/get:
 *   post:
 *     summary: Get gift card requests
 *     description: Fetches a list of gift card requests with optional filters and sorting.
 *     tags:
 *       - Gift Cards
 *     parameters:
 *       - in: body
 *         name: body
 *         description: Request body for fetching gift card requests
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
 *         description: Gift card requests fetched successfully
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
 *                 $ref: '#/definitions/GiftTreesRequest'
 *       500:
 *         description: Internal server error
 *         schema:
 *           type: object
 *           properties:
 *             message:
 *               type: string
 *               example: "Something went wrong. Please try again after some time"
 */
routes.post('/requests/get', giftCards.getGiftCardRequests);

/**
 * @swagger
 * /gift-cards/requests:
 *   post:
 *     summary: Create gift card request
 *     description: Creates a new gift card request.
 *     tags:
 *       - Gift Cards
 *     consumes:
 *       - multipart/form-data
 *     parameters:
 *       - in: formData
 *         name: user_id
 *         description: ID of the user
 *         required: true
 *         type: integer
 *         example: 1
 *       - in: formData
 *         name: group_id
 *         description: ID of the group
 *         required: false
 *         type: integer
 *         example: 2
 *       - in: formData
 *         name: no_of_cards
 *         description: Number of cards
 *         required: true
 *         type: integer
 *         example: 10
 *       - in: formData
 *         name: primary_message
 *         description: Primary message
 *         required: false
 *         type: string
 *         example: "Happy Birthday"
 *       - in: formData
 *         name: secondary_message
 *         description: Secondary message
 *         required: false
 *         type: string
 *         example: "Best wishes"
 *       - in: formData
 *         name: event_name
 *         description: Name of the event
 *         required: false
 *         type: string
 *         example: "Birthday Party"
 *       - in: formData
 *         name: event_type
 *         description: Type of the event
 *         required: false
 *         type: string
 *         example: "Birthday"
 *       - in: formData
 *         name: category
 *         description: Category of the gift card
 *         required: false
 *         type: string
 *         example: "Foundation"
 *       - in: formData
 *         name: grove
 *         description: Grove information
 *         required: false
 *         type: string
 *         example: "Grove A"
 *       - in: formData
 *         name: planted_by
 *         description: Planted by information
 *         required: false
 *         type: string
 *         example: "John Doe"
 *       - in: formData
 *         name: logo_message
 *         description: Logo message
 *         required: false
 *         type: string
 *         example: "Company Logo"
 *       - in: formData
 *         name: request_id
 *         description: Request ID
 *         required: false
 *         type: string
 *         example: "REQ123"
 *       - in: formData
 *         name: notes
 *         description: Additional notes
 *         required: false
 *         type: string
 *         example: "Please deliver by next week"
 *       - in: formData
 *         name: payment_id
 *         description: Payment ID
 *         required: false
 *         type: integer
 *         example: 3
 *       - in: formData
 *         name: created_by
 *         description: Created by user ID
 *         required: false
 *         type: integer
 *         example: 1
 *       - in: formData
 *         name: gifted_on
 *         description: Date when the gift was given
 *         required: false
 *         type: string
 *         format: date-time
 *         example: "2023-10-01T12:34:56Z"
 *       - in: formData
 *         name: request_type
 *         description: Type of the request
 *         required: false
 *         type: string
 *         example: "Normal Assignment"
 *       - in: formData
 *         name: logo
 *         description: Logo file
 *         required: false
 *         type: file
 *       - in: formData
 *         name: csv_file
 *         description: CSV file for bulk upload
 *         required: false
 *         type: file
 *     responses:
 *       200:
 *         description: Gift card request created successfully
 *         schema:
 *           $ref: '#/definitions/GiftTreesRequest'
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
routes.post('/requests', uploadFiles.fields([{name: 'logo', maxCount: 1 }, {name: 'csv_file', maxCount: 1}]), giftCards.createGiftCardRequest);

/**
 * @swagger
 * /gift-cards/requests/{id}:
 *   put:
 *     summary: Update gift card request
 *     description: Updates an existing gift card request.
 *     tags:
 *       - Gift Cards
 *     consumes:
 *       - multipart/form-data
 *     parameters:
 *       - in: formData
 *         name: id
 *         description: ID of the gift card request
 *         required: true
 *         type: integer
 *         example: 1
 *       - in: formData
 *         name: user_id
 *         description: ID of the user
 *         required: false
 *         type: integer
 *         example: 1
 *       - in: formData
 *         name: group_id
 *         description: ID of the group
 *         required: false
 *         type: integer
 *         example: 2
 *       - in: formData
 *         name: no_of_cards
 *         description: Number of cards
 *         required: false
 *         type: integer
 *         example: 10
 *       - in: formData
 *         name: primary_message
 *         description: Primary message
 *         required: false
 *         type: string
 *         example: "Happy Birthday"
 *       - in: formData
 *         name: secondary_message
 *         description: Secondary message
 *         required: false
 *         type: string
 *         example: "Best wishes"
 *       - in: formData
 *         name: event_name
 *         description: Name of the event
 *         required: false
 *         type: string
 *         example: "Birthday Party"
 *       - in: formData
 *         name: event_type
 *         description: Type of the event
 *         required: false
 *         type: string
 *         example: "Birthday"
 *       - in: formData
 *         name: category
 *         description: Category of the gift card
 *         required: false
 *         type: string
 *         example: "Foundation"
 *       - in: formData
 *         name: grove
 *         description: Grove information
 *         required: false
 *         type: string
 *         example: "Grove A"
 *       - in: formData
 *         name: planted_by
 *         description: Planted by information
 *         required: false
 *         type: string
 *         example: "John Doe"
 *       - in: formData
 *         name: logo_message
 *         description: Logo message
 *         required: false
 *         type: string
 *         example: "Company Logo"
 *       - in: formData
 *         name: request_id
 *         description: Request ID
 *         required: false
 *         type: string
 *         example: "REQ123"
 *       - in: formData
 *         name: notes
 *         description: Additional notes
 *         required: false
 *         type: string
 *         example: "Please deliver by next week"
 *       - in: formData
 *         name: payment_id
 *         description: Payment ID
 *         required: false
 *         type: integer
 *         example: 3
 *       - in: formData
 *         name: created_by
 *         description: Created by user ID
 *         required: false
 *         type: integer
 *         example: 1
 *       - in: formData
 *         name: gifted_on
 *         description: Date when the gift was given
 *         required: false
 *         type: string
 *         format: date-time
 *         example: "2023-10-01T12:34:56Z"
 *       - in: formData
 *         name: request_type
 *         description: Type of the request
 *         required: false
 *         type: string
 *         example: "Normal Assignment"
 *       - in: formData
 *         name: validation_errors
 *         description: Validation errors
 *         required: false
 *         type: string
 *         example: "MISSING_LOGO,MISSING_USER_DETAILS"
 *       - in: formData
 *         name: tags
 *         description: Tags associated with the request
 *         required: false
 *         type: string
 *         example: "Birthday,Anniversary"
 *       - in: formData
 *         name: logo
 *         description: Logo file
 *         required: false
 *         type: file
 *       - in: formData
 *         name: csv_file
 *         description: CSV file for bulk upload
 *         required: false
 *         type: file
 *     responses:
 *       200:
 *         description: Gift card request updated successfully
 *         schema:
 *           $ref: '#/definitions/GiftTreesRequest'
 *       404:
 *         description: Gift request not found
 *         schema:
 *           type: object
 *           properties:
 *             status:
 *               type: string
 *               example: "notfound"
 *             message:
 *               type: string
 *               example: "Gift request not found!"
 *       500:
 *         description: Internal server error
 *         schema:
 *           type: object
 *           properties:
 *             message:
 *               type: string
 *               example: "Something went wrong. Please try again later."
 */
routes.put('/requests/:id', uploadFiles.fields([{name: 'logo', maxCount: 1 }, {name: 'csv_file', maxCount: 1}]), giftCards.updateGiftCardRequest);

/**
 * @swagger
 * /gift-cards/requests/{id}:
 *   delete:
 *     summary: Delete gift card request
 *     description: Deletes an existing gift card request.
 *     tags:
 *       - Gift Cards
 *     parameters:
 *       - name: id
 *         in: path
 *         description: ID of the gift card request to delete
 *         required: true
 *         type: integer
 *         example: 1
 *     responses:
 *       200:
 *         description: Gift card request deleted successfully
 *         schema:
 *           type: string
 *           example: "Gift card deleted successfully"
 *       400:
 *         description: Bad request
 *         schema:
 *           type: object
 *           properties:
 *             message:
 *               type: string
 *               example: "Gift card id is required"
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
routes.delete('/requests/:id', giftCards.deleteGiftCardRequest);


/**
 * @swagger
 * /gift-cards/requests/clone:
 *   post:
 *     summary: Clone gift card request
 *     description: Clones an existing gift card request.
 *     tags:
 *       - Gift Cards
 *     parameters:
 *       - in: body
 *         name: body
 *         description: Request body for cloning a gift card request
 *         required: true
 *         schema:
 *           type: object
 *           properties:
 *             gift_card_request_id:
 *               type: integer
 *               example: 1
 *             request_id:
 *               type: string
 *               example: "REQ123"
 *             created_by:
 *               type: integer
 *               example: 1
 *     responses:
 *       200:
 *         description: Gift card request cloned successfully
 *         schema:
 *            $ref: '#/definitions/GiftTreesRequest'
 *       400:
 *         description: Bad request
 *         schema:
 *           type: object
 *           properties:
 *             message:
 *               type: string
 *               example: "Please provide valid input details!"
 *       404:
 *         description: Gift request not found
 *         schema:
 *           type: object
 *           properties:
 *             status:
 *               type: string
 *               example: "notfound"
 *             message:
 *               type: string
 *               example: "Gift request not found!"
 *       500:
 *         description: Internal server error
 *         schema:
 *           type: object
 *           properties:
 *             message:
 *               type: string
 *               example: "Something went wrong. Please try again later."
 */
routes.post('/requests/clone', giftCards.cloneGiftCardRequest);


/**
 * @swagger
 * /gift-cards/:
 *   post:
 *     summary: Create gift cards
 *     description: Creates gift cards for users associated with a gift card request.
 *     tags:
 *       - Gift Cards
 *     parameters:
 *       - in: body
 *         name: body
 *         description: Request body for creating gift cards
 *         required: true
 *         schema:
 *           type: object
 *           properties:
 *             gift_card_request_id:
 *               type: integer
 *               example: 1
 *             users:
 *               type: array
 *               items:
 *                 type: object
 *                 properties:
 *                   gifted_to:
 *                     type: integer
 *                     example: 1
 *                   gifted_to_name:
 *                     type: string
 *                     example: "John Doe"
 *                   gifted_to_email:
 *                     type: string
 *                     example: "john.doe@example.com"
 *                   gifted_to_phone:
 *                     type: string
 *                     example: "9876543210"
 *                   gifted_to_dob:
 *                     type: string
 *                     format: date
 *                     example: "1990-01-01"
 *                   assigned_to:
 *                     type: integer
 *                     example: 2
 *                   assigned_to_name:
 *                     type: string
 *                     example: "Jane Doe"
 *                   assigned_to_email:
 *                     type: string
 *                     example: "jane.doe@example.com"
 *                   assigned_to_phone:
 *                     type: string
 *                     example: "9876543211"
 *                   assigned_to_dob:
 *                     type: string
 *                     format: date
 *                     example: "1991-01-01"
 *                   relation:
 *                     type: string
 *                     example: "Friend"
 *                   image_name:
 *                     type: string
 *                     example: "profile.jpg"
 *                   count:
 *                     type: integer
 *                     example: 1
 *     responses:
 *       200:
 *         description: Gift cards created successfully
 *         schema:
 *           $ref: '#/definitions/GiftTreesRequest'
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
routes.post('/', giftCards.createGiftCards);


/**
 * @swagger
 * /gift-card/users/{gift_card_request_id}:
 *   get:
 *     summary: Get gift request users
 *     description: Fetches users associated with a gift card request.
 *     tags:
 *       - Gift Cards
 *     parameters:
 *       - name: gift_card_request_id
 *         in: path
 *         description: ID of the gift card request
 *         required: true
 *         type: integer
 *         example: 1
 *     responses:
 *       200:
 *         description: Gift request users fetched successfully
 *         schema:
 *           type: array
 *           items:
 *             $ref: '#/definitions/GiftTreesRequest'
 *       400:
 *         description: Bad request
 *         schema:
 *           type: object
 *           properties:
 *             message:
 *               type: string
 *               example: "Tree card request id is required"
 *       500:
 *         description: Internal server error
 *         schema:
 *           type: object
 *           properties:
 *             message:
 *               type: string
 *               example: "Something went wrong. Please try again later."
 */
routes.get('/users/:gift_card_request_id', giftCards.getGiftRequestUsers);


/**
 * @swagger
 * /gift-cards/users:
 *   post:
 *     summary: Upsert gift request users
 *     description: Adds or updates users associated with a gift card request.
 *     tags:
 *       - Gift Cards
 *     parameters:
 *       - in: body
 *         name: body
 *         description: Request body for upserting gift request users
 *         required: true
 *         schema:
 *           type: object
 *           properties:
 *             gift_card_request_id:
 *               type: integer
 *               example: 1
 *             users:
 *               type: array
 *               items:
 *                 type: object
 *                 properties:
 *                   id:
 *                     type: integer
 *                     example: 1
 *                   gifted_to:
 *                     type: integer
 *                     example: 1
 *                   gifted_to_name:
 *                     type: string
 *                     example: "John Doe"
 *                   gifted_to_email:
 *                     type: string
 *                     example: "john.doe@example.com"
 *                   gifted_to_phone:
 *                     type: string
 *                     example: "9876543210"
 *                   gifted_to_dob:
 *                     type: string
 *                     format: date
 *                     example: "1990-01-01"
 *                   assigned_to:
 *                     type: integer
 *                     example: 2
 *                   assigned_to_name:
 *                     type: string
 *                     example: "Jane Doe"
 *                   assigned_to_email:
 *                     type: string
 *                     example: "jane.doe@example.com"
 *                   assigned_to_phone:
 *                     type: string
 *                     example: "9876543211"
 *                   assigned_to_dob:
 *                     type: string
 *                     format: date
 *                     example: "1991-01-01"
 *                   relation:
 *                     type: string
 *                     example: "Friend"
 *                   profile_image_url:
 *                     type: string
 *                     example: "https://example.com/profile.jpg"
 *                   count:
 *                     type: integer
 *                     example: 1
 *     responses:
 *       200:
 *         description: Gift request users upserted successfully
 *         schema:
 *           $ref: '#/definitions/GiftTreesRequest'
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
routes.post('/users', giftCards.upsertGiftRequestUsers);


/**
 * @swagger
 * /gift-cards/plots:
 *   post:
 *     summary: Create gift card plots
 *     description: Associates plot IDs with a gift card request.
 *     tags:
 *       - Gift Cards
 *     parameters:
 *       - in: body
 *         name: body
 *         description: Request body for creating gift card plots
 *         required: true
 *         schema:
 *           type: object
 *           properties:
 *             gift_card_request_id:
 *               type: integer
 *               example: 1
 *             plot_ids:
 *               type: array
 *               items:
 *                 type: integer
 *               example: [101, 102, 103]
 *     responses:
 *       200:
 *         description: Gift card plots created successfully
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
routes.post('/plots', giftCards.createGiftCardPlots);


/**
 * @swagger
 * /gift-cards/book:
 *   post:
 *     summary: Book trees for gift request
 *     description: Books trees for a gift card request.
 *     tags:
 *       - Gift Cards
 *     parameters:
 *       - in: body
 *         name: body
 *         description: Request body for booking trees for a gift card request
 *         required: true
 *         schema:
 *           type: object
 *           properties:
 *             gift_card_request_id:
 *               type: integer
 *               example: 1
 *             gift_card_trees:
 *               type: array
 *               items:
 *                 type: object
 *                 properties:
 *                   tree_id:
 *                     type: integer
 *                     example: 101
 *             diversify:
 *               type: boolean
 *               example: true
 *             book_non_giftable:
 *               type: boolean
 *               example: false
 *             book_all_habits:
 *               type: boolean
 *               example: false
 *     responses:
 *       200:
 *         description: Trees booked successfully
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
routes.post('/book', giftCards.bookTreesForGiftRequest);


/**
 * @swagger
 * /gift-cards/unbook:
 *   post:
 *     summary: Unbook trees
 *     description: Unbooks trees associated with a gift card request.
 *     tags:
 *       - Gift Cards
 *     parameters:
 *       - in: body
 *         name: body
 *         description: Request body for unbooking trees
 *         required: true
 *         schema:
 *           type: object
 *           properties:
 *             gift_card_request_id:
 *               type: integer
 *               example: 1
 *             tree_ids:
 *               type: array
 *               items:
 *                 type: integer
 *               example: [101, 102, 103]
 *             unmap_all:
 *               type: boolean
 *               example: true
 *     responses:
 *       200:
 *         description: Trees unbooked successfully
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
routes.post('/unbook', giftCards.unBookTrees);


/**
 * @swagger
 * /gift-cards/trees/{gift_card_request_id}:
 *   get:
 *     summary: Get booked trees
 *     description: Fetches trees booked for a gift card request.
 *     tags:
 *       - Gift Cards
 *     parameters:
 *       - name: gift_card_request_id
 *         in: path
 *         description: ID of the gift card request
 *         required: true
 *         type: integer
 *         example: 1
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
 *         description: Booked trees fetched successfully
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
 *                 $ref: '#/definitions/GiftRequestTree'
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
routes.get('/trees/:gift_card_request_id', giftCards.getBookedTrees);


/**
 * @swagger
 * /gift-cards/generate-template:
 *   post:
 *     summary: Generate gift card slide
 *     description: Generates a slide for a gift card.
 *     tags:
 *       - Gift Cards
 *     parameters:
 *       - in: body
 *         name: body
 *         description: Request body for generating a gift card slide
 *         required: true
 *         schema:
 *           type: object
 *           properties:
 *             sapling_id:
 *               type: string
 *               example: "00000"
 *             plant_type:
 *               type: string
 *               example: "Tree"
 *             user_name:
 *               type: string
 *               example: "John Doe"
 *             primary_message:
 *               type: string
 *               example: "Happy Birthday"
 *             secondary_message:
 *               type: string
 *               example: "Best wishes"
 *             logo:
 *               type: string
 *               example: "https://example.com/logo.jpg"
 *             logo_message:
 *               type: string
 *               example: "Company Logo"
 *     responses:
 *       200:
 *         description: Gift card slide generated successfully
 *         schema:
 *           type: object
 *           properties:
 *             presentation_id:
 *               type: string
 *               example: "presentation123"
 *             slide_id:
 *               type: string
 *               example: "slide123"
 *       500:
 *         description: Internal server error
 *         schema:
 *           type: object
 *           properties:
 *             message:
 *               type: string
 *               example: "Something went wrong. Please try again later."
 */
routes.post('/generate-template/', giftCards.generateGiftCardSlide);


/**
 * @swagger
 * /gift-cards/update-template:
 *   post:
 *     summary: Update gift card template
 *     description: Updates an existing gift card template slide.
 *     tags:
 *       - Gift Cards
 *     parameters:
 *       - in: body
 *         name: body
 *         description: Request body for updating a gift card template slide
 *         required: true
 *         schema:
 *           type: object
 *           properties:
 *             user_name:
 *               type: string
 *               example: "John Doe"
 *             sapling_id:
 *               type: string
 *               example: "00000"
 *             slide_id:
 *               type: string
 *               example: "slide123"
 *             primary_message:
 *               type: string
 *               example: "Happy Birthday"
 *             secondary_message:
 *               type: string
 *               example: "Best wishes"
 *             logo:
 *               type: string
 *               example: "https://example.com/logo.jpg"
 *             logo_message:
 *               type: string
 *               example: "Company Logo"
 *     responses:
 *       200:
 *         description: Gift card template updated successfully
 *       400:
 *         description: Bad request
 *         schema:
 *           type: object
 *           properties:
 *             status:
 *               type: string
 *               example: "bad"
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
routes.post('/update-template', giftCards.updateGiftCardTemplate);


/**
 * @swagger
 * /gift-cards/card/redeem:
 *   post:
 *     summary: Redeem gift card
 *     description: Redeems a gift card and assigns it to a user.
 *     tags:
 *       - Gift Cards
 *     parameters:
 *       - in: body
 *         name: body
 *         description: Request body for redeeming a gift card
 *         required: true
 *         schema:
 *           type: object
 *           properties:
 *             gift_card_id:
 *               type: integer
 *               example: 1
 *             event_type:
 *               type: string
 *               example: "Birthday"
 *             event_name:
 *               type: string
 *               example: "John's Birthday"
 *             gifted_on:
 *               type: string
 *               format: date-time
 *               example: "2023-10-01T12:34:56Z"
 *             gifted_by:
 *               type: string
 *               example: "Jane Doe"
 *             user:
 *               type: object
 *               properties:
 *                 id:
 *                   type: integer
 *                   example: 1
 *                 name:
 *                   type: string
 *                   example: "John Doe"
 *                 email:
 *                   type: string
 *                   example: "john.doe@example.com"
 *             tree_id:
 *               type: integer
 *               example: 101
 *             profile_image_url:
 *               type: string
 *               example: "https://example.com/profile.jpg"
 *     responses:
 *       200:
 *         description: Gift card redeemed successfully
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
routes.post('/card/redeem', giftCards.redeemGiftCard);


/**
 * @swagger
 * /gift-cards/card/redeem-multi:
 *   post:
 *     summary: Redeem gift multiple cards
 *     description: Redeems gift cards and assigns it to a user.
 *     tags:
 *       - Gift Cards
 *     parameters:
 *       - in: body
 *         name: body
 *         description: Request body for redeeming a gift card
 *         required: true
 *         schema:
 *           type: object
 *           properties:
 *             trees_count:
 *               type: integer
 *               example: 1
 *             sponsor_group:
 *               type: integer
 *               example: 1
 *             event_type:
 *               type: string
 *               example: "Birthday"
 *             event_name:
 *               type: string
 *               example: "John's Birthday"
 *             gifted_on:
 *               type: string
 *               format: date-time
 *               example: "2023-10-01T12:34:56Z"
 *             gifted_by:
 *               type: string
 *               example: "Jane Doe"
 *             user:
 *               type: object
 *               properties:
 *                 id:
 *                   type: integer
 *                   example: 1
 *                 name:
 *                   type: string
 *                   example: "John Doe"
 *                 email:
 *                   type: string
 *                   example: "john.doe@example.com"
 *             profile_image_url:
 *               type: string
 *               example: "https://example.com/profile.jpg"
 *     responses:
 *       200:
 *         description: Gift card redeemed successfully
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
routes.post('/card/redeem-multi', giftCards.redeemMultipleGiftCard);


/**
 * @swagger
 * /gift-cards/assign:
 *   post:
 *     summary: Assign gift request trees
 *     description: Assigns trees to users for a gift card request.
 *     tags:
 *       - Gift Cards
 *     parameters:
 *       - in: body
 *         name: body
 *         description: Request body for assigning trees to a gift card request
 *         required: true
 *         schema:
 *           type: object
 *           properties:
 *             gift_card_request_id:
 *               type: integer
 *               example: 1
 *             trees:
 *               type: array
 *               items:
 *                 type: object
 *                 properties:
 *                   tree_id:
 *                     type: integer
 *                     example: 101
 *                   user_id:
 *                     type: integer
 *                     example: 1
 *             auto_assign:
 *               type: boolean
 *               example: true
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
routes.post('/assign', giftCards.assignGiftRequestTrees);


/**
 * @swagger
 * /gift-cards/generate/{gift_card_request_id}:
 *   post:
 *     summary: Generate gift card templates for gift card request
 *     description: Generates gift card templates for a specific gift card request.
 *     tags:
 *       - Gift Cards
 *     parameters:
 *       - name: gift_card_request_id
 *         in: path
 *         description: ID of the gift card request
 *         required: true
 *         type: integer
 *         example: 1
 *     responses:
 *       200:
 *         description: Gift card templates generation initiated successfully
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
routes.get('/generate/:gift_card_request_id', giftCards.generateGiftCardTemplatesForGiftCardRequest);



/**
 * @swagger
 * /gift-cards/update-card-images/{gift_card_request_id}:
 *   post:
 *     summary: Update gift card images for gift card request
 *     description: Updates gift card images for a specific gift card request.
 *     tags:
 *       - Gift Cards
 *     parameters:
 *       - name: gift_card_request_id
 *         in: path
 *         description: ID of the gift card request
 *         required: true
 *         type: integer
 *         example: 1
 *     responses:
 *       200:
 *         description: Gift card image generation initiated successfully
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
routes.get('/update-card-images/:gift_card_request_id', giftCards.updateGiftCardImagesForGiftRequest);


/**
 * @swagger
 * /gift-cards/download/{gift_card_request_id}:
 *   get:
 *     summary: Download gift card templates for gift card request
 *     description: Downloads the gift card templates for a specific gift card request in the specified format.
 *     tags:
 *       - Gift Cards
 *     parameters:
 *       - name: gift_card_request_id
 *         in: path
 *         description: ID of the gift card request
 *         required: true
 *         type: integer
 *         example: 1
 *       - name: downloadType
 *         in: query
 *         description: The format to download the gift card templates in (zip, pdf, ppt)
 *         required: true
 *         type: string
 *         enum: [zip, pdf, ppt]
 *         example: "pdf"
 *     responses:
 *       200:
 *         description: Gift card templates downloaded successfully
 *         schema:
 *           type: file
 *       400:
 *         description: Bad request
 *         schema:
 *           type: object
 *           properties:
 *             message:
 *               type: string
 *               example: 'Unsupported format. Use "zip", "pdf" or "ppt".'
 *       500:
 *         description: Internal server error
 *         schema:
 *           type: object
 *           properties:
 *             message:
 *               type: string
 *               example: "Something went wrong. Please try again later."
 */
routes.get('/download/:gift_card_request_id', giftCards.downloadGiftCardTemplatesForGiftCardRequest);


/**
 * @swagger
 * /gift-cards/email:
 *   post:
 *     summary: Send email for gift card request
 *     description: Sends emails related to a gift card request.
 *     tags:
 *       - Gift Cards
 *     parameters:
 *       - in: body
 *         name: body
 *         description: Request body for sending emails for a gift card request
 *         required: true
 *         schema:
 *           type: object
 *           properties:
 *             gift_card_request_id:
 *               type: integer
 *               example: 1
 *             test_mails:
 *               type: array
 *               items:
 *                 type: string
 *               example: ["test@example.com"]
 *             receiver_cc_mails:
 *               type: array
 *               items:
 *                 type: string
 *               example: ["cc@example.com"]
 *             sponsor_cc_mails:
 *               type: array
 *               items:
 *                 type: string
 *               example: ["cc@example.com"]
 *             attach_card:
 *               type: boolean
 *               example: true
 *             event_type:
 *               type: string
 *               example: "Birthday"
 *             email_sponsor:
 *               type: boolean
 *               example: true
 *             email_receiver:
 *               type: boolean
 *               example: true
 *             email_assignee:
 *               type: boolean
 *               example: true
 *     responses:
 *       200:
 *         description: Emails sent successfully
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
routes.post('/email', giftCards.sendEmailForGiftCardRequest);


/**
 * @swagger
 * /gift-cards/update-album:
 *   post:
 *     summary: Update gift card request album
 *     description: Updates the album associated with a gift card request.
 *     tags:
 *       - Gift Cards
 *     parameters:
 *       - in: body
 *         name: body
 *         description: Request body for updating gift card request album
 *         required: true
 *         schema:
 *           type: object
 *           properties:
 *             gift_card_request_id:
 *               type: integer
 *               example: 1
 *             album_id:
 *               type: integer
 *               example: 2
 *     responses:
 *       200:
 *         description: Gift card request album updated successfully
 *       400:
 *         description: Bad request
 *         schema:
 *           type: object
 *           properties:
 *             message:
 *               type: string
 *               example: "Invalid input!"
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
routes.post('/update-album/', giftCards.updateGiftCardRequestAlbum);


/**
 * @swagger
 * /gift-cards/update-users:
 *   post:
 *     summary: Update gift card user details
 *     description: Updates the details of users associated with a gift card request.
 *     tags:
 *       - Gift Cards
 *     parameters:
 *       - in: body
 *         name: body
 *         description: Request body for updating gift card user details
 *         required: true
 *         schema:
 *           type: object
 *           properties:
 *             users:
 *               type: array
 *               items:
 *                 type: object
 *                 properties:
 *                   id:
 *                     type: integer
 *                     example: 1
 *                   recipient:
 *                     type: integer
 *                     example: 1
 *                   recipient_name:
 *                     type: string
 *                     example: "John Doe"
 *                   recipient_email:
 *                     type: string
 *                     example: "john.doe@example.com"
 *                   recipient_phone:
 *                     type: string
 *                     example: "9876543210"
 *                   assignee:
 *                     type: integer
 *                     example: 2
 *                   assignee_name:
 *                     type: string
 *                     example: "Jane Doe"
 *                   assignee_email:
 *                     type: string
 *                     example: "jane.doe@example.com"
 *                   assignee_phone:
 *                     type: string
 *                     example: "9876543211"
 *                   relation:
 *                     type: string
 *                     example: "Friend"
 *                   profile_image_url:
 *                     type: string
 *                     example: "https://example.com/profile.jpg"
 *                   gift_request_id:
 *                     type: integer
 *                     example: 1
 *     responses:
 *       200:
 *         description: User details updated successfully
 *       400:
 *         description: Bad request
 *         schema:
 *           type: object
 *           properties:
 *             status:
 *               type: string
 *               example: "bad"
 *             message:
 *               type: string
 *               example: "Invalid request!"
 *       500:
 *         description: Internal server error
 *         schema:
 *           type: object
 *           properties:
 *             message:
 *               type: string
 *               example: "Something went wrong. Please try again later."
 */
routes.post('/update-users/', giftCards.updateGiftCardUserDetails);

/**
 * @swagger
 * /gift-cards/requests/tags:
 *   get:
 *     summary: Get gift request tags
 *     description: Fetches a list of gift request tags.
 *     tags:
 *       - Gift Cards
 *     responses:
 *       200:
 *         description: Gift request tags fetched successfully
 *         schema:
 *           type: array
 *           items:
 *             type: string
 *             example: "Birthday"
 *       500:
 *         description: Internal server error
 *         schema:
 *           type: object
 *           properties:
 *             message:
 *               type: string
 *               example: "Something went wrong. Please try again after some time"
 */
routes.get('/requests/tags', giftCards.getGiftRequestTags);


/**
 * @swagger
 * /gift-cards/requests/fund-request/{gift_card_request_id}:
 *   post:
 *     summary: Generate fund request
 *     description: Generates a fund request for a specific gift card request.
 *     tags:
 *       - Gift Cards
 *     parameters:
 *       - name: gift_card_request_id
 *         in: path
 *         description: ID of the gift card request
 *         required: true
 *         type: integer
 *         example: 1
 *     responses:
 *       200:
 *         description: Fund request generated successfully
 *         schema:
 *           type: object
 *           properties:
 *             url:
 *               type: string
 *               example: "https://example.com/fund_request.pdf"
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
routes.get('/requests/fund-request/:gift_card_request_id', giftCards.generateFundRequest);

routes.get('/transactions/:id', transactions.getTransactions);
routes.post('/transactions/send-email', transactions.sendEmailForTransaction);



/**
 * @swagger
 * /transactions/update:
 *   patch:
 *     summary: Update transaction
 *     description: Updates a transaction
 *     tags:
 *       - Gift Cards
 *     parameters:
 *       - in: body
 *         name: body
 *         description: Request body for updating a transaction
 *         required: true
 *         schema:
 *           type: object
 *           properties:
 *             transaction_id:
 *               type: integer
 *               example: 1
 *             mask:
 *               type: array
 *               items:
 *                 type: string
 *                 example: "primary_message"
 *             data:
 *               type: object
 *               properties:
 *                 primary_message:
 *                   type: string
 *                   example: "Happy Birthday"
 *                 secondary_message:
 *                   type: string
 *                   example: "Best wishes"
 *                 logo_message:
 *                   type: string
 *                   example: "Company Logo"
 *                 name:
 *                   type: string
 *                   example: "John Doe"
 *                 occasion_type:
 *                   type: string
 *                   example: "Birthday"
 *     responses:
 *        200:
 *          description: Transaction updated successfully
 *        400:
 *          description: Bad request
 *        500:
 *          description: Internal server error
 *          schema:
 *            type: object
 *            properties:
 *              message:
 *                type: string
 *                example: "Something went wrong. Please try again later."
 */
routes.patch('/transactions/update', transactions.updateTransaction);


/**
 * @swagger
 * /transactions/tree-cards/{transaction_id}:
 *   get:
 *     summary: Get tree cards for a transaction
 *     description: Get tree cards for a transaction
 *     tags:
 *       - Gift Cards
 *     parameters:
 *       - name: transaction_id
 *         in: path
 *         description: ID of the transaction
 *         required: true
 *         type: integer
 *         example: 1
 *     responses:
 *       200:
 *         description: Tree cards fetched successfully
 *         schema:
 *           type: array
 *           items:
 *             type: string
 *             example: "https://example.com/tree_card.jpg"
 *       400:
 *         description: Bad request
 *         schema:
 *           type: object
 *           properties:
 *             message:
 *               type: string
 *               example: "Invalid request. Please provide valid transaction id!"
 *       500:
 *         description: Internal server error
 *         schema:
 *           type: object
 *           properties:
 *             message:
 *               type: string
 *               example: "Something went wrong. Please try again later."
 */
routes.get('/transactions/tree-cards/:transaction_id', transactions.getTrancationTreeCardImages);


/**
 * @swagger
 * /transactions/tree-cards/download/:transaction_id:
 *   get:
 *     summary: Download tree cards for a transaction
 *     description: Download tree cards for a transaction
 *     tags:
 *       - Gift Cards
 *     parameters:
 *       - name: transaction_id
 *         in: path
 *         description: ID of the transaction
 *         required: true
 *         type: integer
 *         example: 1
 *     responses:
 *       200:
 *         description: Tree cards downloaded successfully
 *         schema:
 *           type: string
 *       400:
 *         description: Bad request
 *         schema:
 *           type: object
 *           properties:
 *             message:
 *               type: string
 *               example: "Invalid request. Please provide valid transaction id!"
 *       500:
 *         description: Internal server error
 *         schema:
 *           type: object
 *           properties:
 *             message:
 *               type: string
 *               example: "Something went wrong. Please try again later."
 */
routes.get('/transactions/tree-cards/download/:transaction_id', transactions.downloadTrancationTreeCardImages);

export default routes;

