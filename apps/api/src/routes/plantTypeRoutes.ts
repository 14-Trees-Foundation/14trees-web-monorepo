import { Router } from "express";
import uploadFiles from "../helpers/multer";
import * as plantTypes from '../controllers/plantTypeController'

const routes = Router();

/**
 * @swagger
 * /plant-types/tags/get:
 *   get:
 *     summary: Get plant type tags
 *     description: Fetches a list of unique plant type tags.
 *     tags:
 *       - Plant Types
 *     responses:
 *       200:
 *         description: Plant type tags fetched successfully
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
 *               example: ["Tag A"]
 *       500:
 *         description: Internal server error
 *         schema:
 *           type: object
 *           properties:
 *             message:
 *               type: string
 *               example: "Something went wrong. Please try again after some time"
 */
routes.get("/tags/get", plantTypes.getPlantTypeTags);

/**
 * @swagger
 * /getPlantTypes:
 *   post:
 *     summary: Get plant types
 *     description: Fetches a list of plant types with optional filters.
 *     tags:
 *       - Plant Types
 *     parameters:
 *       - in: body
 *         name: body
 *         description: Request body for fetching plant types
 *         required: false
 *         schema:
 *           type: object
 *           properties:
 *             filters:
 *               type: array
 *               items:
 *                 $ref: '#/definitions/Filter'
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
 *         description: Plant types fetched successfully
 *         schema:
 *           type: object
 *           properties:
 *             offset:
 *               type: integer
 *               example: 0
 *             total:
 *               type: integer
 *               example: 40
 *             results:
 *               type: array
 *               items:
 *                 $ref: '#/definitions/PlantType'
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
routes.post("/get", plantTypes.getPlantTypes);

/**
 * @swagger
 * /getPlantTypesForPlot/{plot_id}:
 *   get:
 *     summary: Get plant types for plot
 *     description: Fetches plant types present in a specific plot.
 *     tags:
 *       - Plant Types
 *     parameters:
 *       - name: plot_id
 *         in: path
 *         description: ID of the plot
 *         required: true
 *         type: integer
 *         example: 1
 *     responses:
 *       200:
 *         description: Plant types fetched successfully
 *         schema:
 *           type: array
 *           items:
 *             $ref: '#/definitions/PlantType'
 *       400:
 *         description: Invalid plot ID
 *         schema:
 *           type: object
 *           properties:
 *             error:
 *               type: string
 *               example: "Please provide valid plot id!"
 *       500:
 *         description: Internal server error
 *         schema:
 *           type: object
 *           properties:
 *             error:
 *               type: string
 *               example: "Something went wrong. Please try again after some time"
 */
routes.get('/:plot_id', plantTypes.getPlantTypesForPlot);

/**
 * @swagger
 * /plant-types:
 *   post:
 *     summary: Add plant type
 *     description: Adds a new plant type to the system.
 *     tags:
 *       - Plant Types
 *     consumes:
 *       - multipart/form-data
 *     parameters:
 *       - in: formData
 *         name: name
 *         description: Name of the plant type
 *         required: true
 *         type: string
 *         example: "Plant A"
 *       - in: formData
 *         name: english_name
 *         description: English name of the plant type
 *         required: false
 *         type: string
 *         example: "English Plant A"
 *       - in: formData
 *         name: common_name_in_english
 *         description: Common name in English
 *         required: false
 *         type: string
 *         example: "Common English Name"
 *       - in: formData
 *         name: common_name_in_marathi
 *         description: Common name in Marathi
 *         required: false
 *         type: string
 *         example: "Common Marathi Name"
 *       - in: formData
 *         name: plant_type_id
 *         description: Plant type ID
 *         required: false
 *         type: string
 *         example: "PT123"
 *       - in: formData
 *         name: scientific_name
 *         description: Scientific name of the plant type
 *         required: false
 *         type: string
 *         example: "Scientific Name"
 *       - in: formData
 *         name: family
 *         description: Family of the plant type
 *         required: false
 *         type: string
 *         example: "Family Name"
 *       - in: formData
 *         name: tags
 *         description: Tags associated with the plant type
 *         required: false
 *         type: string
 *         example: "Tag1,Tag2"
 *       - in: formData
 *         name: habit
 *         description: Habit of the plant type
 *         required: false
 *         type: string
 *         example: "Habit"
 *       - in: formData
 *         name: known_as
 *         description: Other names the plant type is known as
 *         required: false
 *         type: string
 *         example: "Known As"
 *       - in: formData
 *         name: use
 *         description: Uses of the plant type
 *         required: false
 *         type: string
 *         example: "Use"
 *       - in: formData
 *         name: category
 *         description: Category of the plant type
 *         required: false
 *         type: string
 *         example: "Category"
 *       - in: formData
 *         name: names_index
 *         description: Index of names
 *         required: false
 *         type: string
 *         example: "Names Index"
 *       - in: formData
 *         name: files
 *         description: Images of the plant type
 *         required: false
 *         type: array
 *         items:
 *           type: file
 *     responses:
 *       201:
 *         description: Plant type added successfully
 *         schema:
 *           $ref: '#/definitions/PlantType'
 *       400:
 *         description: Bad request
 *         schema:
 *           type: object
 *           properties:
 *             error:
 *               type: string
 *               example: "PlantName (name) is required"
 *       500:
 *         description: Internal server error
 *         schema:
 *           type: object
 *           properties:
 *             error:
 *               type: string
 *               example: "Something went wrong. Please try again later."
 */
routes.post("/", uploadFiles.array("files", 4), plantTypes.addPlantType);

/**
 * @swagger
 * /plant-types/{id}:
 *   put:
 *     summary: Update plant type
 *     description: Updates an existing plant type.
 *     tags:
 *       - Plant Types
 *     consumes:
 *       - multipart/form-data
 *     parameters:
 *       - in: formData
 *         name: id
 *         description: ID of the plant type
 *         required: true
 *         type: integer
 *         example: 1
 *       - in: formData
 *         name: name
 *         description: Name of the plant type
 *         required: false
 *         type: string
 *         example: "Plant A"
 *       - in: formData
 *         name: english_name
 *         description: English name of the plant type
 *         required: false
 *         type: string
 *         example: "English Plant A"
 *       - in: formData
 *         name: common_name_in_english
 *         description: Common name in English
 *         required: false
 *         type: string
 *         example: "Common English Name"
 *       - in: formData
 *         name: common_name_in_marathi
 *         description: Common name in Marathi
 *         required: false
 *         type: string
 *         example: "Common Marathi Name"
 *       - in: formData
 *         name: plant_type_id
 *         description: Plant type ID
 *         required: false
 *         type: string
 *         example: "PT123"
 *       - in: formData
 *         name: scientific_name
 *         description: Scientific name of the plant type
 *         required: false
 *         type: string
 *         example: "Scientific Name"
 *       - in: formData
 *         name: family
 *         description: Family of the plant type
 *         required: false
 *         type: string
 *         example: "Family Name"
 *       - in: formData
 *         name: tags
 *         description: Tags associated with the plant type
 *         required: false
 *         type: string
 *         example: "Tag1,Tag2"
 *       - in: formData
 *         name: habit
 *         description: Habit of the plant type
 *         required: false
 *         type: string
 *         example: "Habit"
 *       - in: formData
 *         name: known_as
 *         description: Other names the plant type is known as
 *         required: false
 *         type: string
 *         example: "Known As"
 *       - in: formData
 *         name: use
 *         description: Uses of the plant type
 *         required: false
 *         type: string
 *         example: "Use"
 *       - in: formData
 *         name: category
 *         description: Category of the plant type
 *         required: false
 *         type: string
 *         example: "Category"
 *       - in: formData
 *         name: names_index
 *         description: Index of names
 *         required: false
 *         type: string
 *         example: "Names Index"
 *       - in: formData
 *         name: files
 *         description: Images of the plant type
 *         required: false
 *         type: array
 *         items:
 *           type: file
 *     responses:
 *       200:
 *         description: Plant type updated successfully
 *         schema:
 *           $ref: '#/definitions/PlantType'
 *       400:
 *         description: Bad request
 *         schema:
 *           type: object
 *           properties:
 *             error:
 *               type: string
 *               example: "Tree type not found"
 *       500:
 *         description: Internal server error
 *         schema:
 *           type: object
 *           properties:
 *             error:
 *               type: string
 *               example: "Something went wrong. Please try again later."
 */
routes.put('/:id', uploadFiles.array('files', 4), plantTypes.updatePlantType);

/**
 * @swagger
 * /plant-types/{id}:
 *   delete:
 *     summary: Delete plant type
 *     description: Deletes a plant type by its ID.
 *     tags:
 *       - Plant Types
 *     parameters:
 *       - name: id
 *         in: path
 *         description: ID of the plant type to delete
 *         required: true
 *         type: integer
 *         example: 1
 *     responses:
 *       200:
 *         description: Plant type deleted successfully
 *         schema:
 *           type: object
 *           properties:
 *             message:
 *               type: string
 *               example: "Plant Type with id '1' deleted successfully"
 *       400:
 *         description: Bad request
 *         schema:
 *           type: object
 *           properties:
 *             error:
 *               type: string
 *               example: "Invalid plant type ID"
 *       500:
 *         description: Internal server error
 *         schema:
 *           type: object
 *           properties:
 *             error:
 *               type: string
 *               example: "Something went wrong. Please try again later."
 */
routes.delete('/:id', plantTypes.deletePlantType);

/**
 * @swagger
 * /plant-types/states:
 *   post:
 *     summary: Get tree counts for plant types
 *     description: Fetches tree counts for plant types with optional filters and sorting.
 *     tags:
 *       - Plant Types
 *     parameters:
 *       - in: body
 *         name: body
 *         description: Request body for fetching tree counts for plant types
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
 *         description: Tree counts for plant types fetched successfully
 *         schema:
 *           type: object
 *           properties:
 *             offset:
 *               type: integer
 *               example: 0
 *             total:
 *               type: integer
 *               example: 40
 *             results:
 *               type: array
 *               items:
 *                 type: object
 *                 properties:
 *                   id:
 *                     type: integer
 *                     example: 1
 *                   plant_type:
 *                     type: string
 *                     example: "string"
 *                   habit:
 *                     type: string
 *                     example: "Tree"
 *                   illustration_link:
 *                     type: string
 *                     example: "string"
 *                   template_id:
 *                     type: string
 *                     example: "string"
 *                   total:
 *                     type: integer
 *                     example: 100
 *                   booked:
 *                     type: integer
 *                     example: 50
 *                   assigned:
 *                     type: integer
 *                     example: 30
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
 *               example: "Something went wrong. Please try again after some time"
 */
routes.post('/states', plantTypes.getTreeCountsForPlantTypes);

/**
 * @swagger
 * /plant-types/plot-states:
 *   post:
 *     summary: Get plant type state for plots
 *     description: Fetches plant type state for plots with optional filters and sorting.
 *     tags:
 *       - Plant Types
 *     parameters:
 *       - in: body
 *         name: body
 *         description: Request body for fetching plant type state for plots
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
 *                 $ref: '#/definitions/Orderby'
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
 *         description: Plant type state for plots fetched successfully
 *         schema:
 *           type: object
 *           properties:
 *             offset:
 *               type: integer
 *               example: 0
 *             total:
 *               type: integer
 *               example: 40
 *             results:
 *               type: array
 *               items:
 *                 type: object
 *                 properties:
 *                   id:
 *                     type: integer
 *                     example: 1
 *                   plant_type:
 *                     type: string
 *                     example: "string"
 *                   habit:
 *                     type: string
 *                     example: "Tree"
 *                   illustration_link:
 *                     type: string
 *                     example: "string"
 *                   template_id:
 *                     type: string
 *                     example: "string"
 *                   plot_id:
 *                     type: integer
 *                     example: 1
 *                   plot_name:
 *                     type: string
 *                     example: "string"
 *                   site_id:
 *                     type: integer
 *                     example: 1
 *                   site_name:
 *                     type: string
 *                     example: "string"
 *                   total:
 *                     type: integer
 *                     example: 100
 *                   booked:
 *                     type: integer
 *                     example: 50
 *                   assigned:
 *                     type: integer
 *                     example: 30
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
 *               example: "Something went wrong. Please try again after some time"
 */
routes.post('/plot-states', plantTypes.getPlantTypeStateForPlots);

/**
 * @swagger
 * /plant-type/sync:
 *   post:
 *     summary: Sync plant type illustrations data from Notion
 *     description: Syncs plant type illustrations data from Notion and updates the database.
 *     tags:
 *       - Plant Types
 *     responses:
 *       200:
 *         description: Plant type illustrations data synced successfully
 *       500:
 *         description: Internal server error
 *         schema:
 *           type: object
 *           properties:
 *             message:
 *               type: string
 *               example: "Something went wrong!"
 */
routes.post('/sync', plantTypes.syncPlantTypeIllustrationsDataFromNotion);

/**
 * @swagger
 * /addPlantTypeTemplate:
 *   post:
 *     summary: Add plant type template
 *     description: Adds a new plant type template.
 *     tags:
 *       - Plant Types
 *     parameters:
 *       - in: body
 *         name: body
 *         description: Request body for adding a plant type template
 *         required: true
 *         schema:
 *           type: object
 *           properties:
 *             plant_type:
 *               type: string
 *               example: "Plant A"
 *             template_id:
 *               type: string
 *               example: "Template123"
 *     responses:
 *       200:
 *         description: Plant type template added successfully
 *         schema:
 *           type: object
 *           properties:
 *             plant_type:
 *               type: string
 *               example: "Plant A"
 *             template_id:
 *               type: string
 *               example: "Template123"
 *             template_image:
 *               type: string
 *               example: "https://example.com/plant-types/Template123_PlantA.jpg"
 *       400:
 *         description: Bad request
 *         schema:
 *           type: object
 *           properties:
 *             message:
 *               type: string
 *               example: "Please provide valid plantType and templateId!"
 *       500:
 *         description: Internal server error
 *         schema:
 *           type: object
 *           properties:
 *             message:
 *               type: string
 *               example: "Something went wrong. Please try again after some time!"
 */
routes.post('/templates/', plantTypes.addPlantTypeTemplate);

/**
 * @swagger
 * /plant-types/illustrations:
 *   post:
 *     summary: Upload illustrations to S3
 *     description: Uploads plant type illustrations to S3 and updates the database with the S3 paths.
 *     tags:
 *       - Plant Types
 *     responses:
 *       200:
 *         description: Illustrations uploaded successfully
 *       500:
 *         description: Internal server error
 *         schema:
 *           type: object
 *           properties:
 *             message:
 *               type: string
 *               example: "Something went wrong. Please try again after some time!"
 */
routes.post('/illustrations/', plantTypes.uploadIllustrationsToS3);

/**
 * @swagger
 * /plant-types/corporate-stats:
 *   post:
 *     summary: Get plant type stats for corporate
 *     description: Fetches plant type stats for corporate with optional filters.
 *     tags:
 *       - Plant Types
 *     parameters:
 *       - in: body
 *         name: body
 *         description: Request body for fetching plant type stats for corporate
 *         required: false
 *         schema:
 *           type: object
 *           properties:
 *             filters:
 *               type: array
 *               items:
 *                 $ref: '#/definitions/Filter'
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
 *         description: Plant type stats for corporate fetched successfully
 *         schema:
 *           type: object
 *           properties:
 *             results:
 *               type: array
 *               items:
 *                 type: object
 *                 properties:
 *                   id:
 *                     type: integer
 *                     example: 1
 *                   name:
 *                     type: string
 *                     example: "Plant A"
 *                   habit:
 *                     type: string
 *                     example: "Tree"
 *                   category:
 *                     type: string
 *                     example: "Cultivated"
 *                   known_as:
 *                     type: string
 *                     example: "Plant A"
 *                   scientific_name:
 *                     type: string
 *                     example: "Plant A"
 *                   booked:
 *                     type: integer
 *                     example: 50
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
routes.post('/corporate-stats', plantTypes.getPlantTypeStatsForCorporate);

export default routes;