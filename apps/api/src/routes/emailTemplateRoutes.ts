import express from "express";
import {
  createEmailTemplate,
  getEmailTemplates,
  deleteEmailTemplate
} from "../controllers/emailTemplatesController";

const routes = express.Router();

routes.delete("/:id", deleteEmailTemplate);
routes.post("/", createEmailTemplate);
routes.get("/", getEmailTemplates);

export default routes;