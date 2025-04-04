import express from "express";
import {
  createEmailTemplate,
  getEmailTemplates,
  deleteEmailTemplate
} from "../controllers/emailTemplatesController";

const routes = express.Router();

/**
 * @swagger
 * /email-templates/{id}:
 *   delete:
 *     summary: Delete email template
 *     description: Deletes an email template by ID
 *     tags:
 *       - Email Templates
 *     parameters:
 *       - name: id
 *         in: path
 *         description: ID of the email template to delete
 *         required: true
 *         type: integer
 *         example: 1
 *     responses:
 *       200:
 *         description: Email template deleted successfully
 *       404:
 *         description: Email template not found
 *       500:
 *         description: Internal server error
 */
routes.delete("/:id", deleteEmailTemplate);

/**
 * @swagger
 * /email-templates:
 *   post:
 *     summary: Create email template
 *     description: Creates a new email template
 *     tags:
 *       - Email Templates
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               name:
 *                 type: string
 *                 example: "Welcome Email"
 *               subject:
 *                 type: string
 *                 example: "Welcome to Our Platform"
 *               body:
 *                 type: string
 *                 example: "Dear {{name}}, Welcome to our platform..."
 *     responses:
 *       201:
 *         description: Email template created successfully
 *       400:
 *         description: Invalid request body
 *       500:
 *         description: Internal server error
 */
routes.post("/", createEmailTemplate);

/**
 * @swagger
 * /email-templates:
 *   get:
 *     summary: Get email templates
 *     description: Retrieves a list of all email templates
 *     tags:
 *       - Email Templates
 *     responses:
 *       200:
 *         description: List of email templates
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 type: object
 *                 properties:
 *                   id:
 *                     type: integer
 *                     example: 1
 *                   name:
 *                     type: string
 *                     example: "Welcome Email"
 *                   subject:
 *                     type: string
 *                     example: "Welcome to Our Platform"
 *                   body:
 *                     type: string
 *                     example: "Dear {{name}}, Welcome to our platform..."
 *       500:
 *         description: Internal server error
 */
routes.get("/", getEmailTemplates);

export default routes;