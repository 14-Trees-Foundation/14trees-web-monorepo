import { Request, Response } from "express";
import { UserRepository } from "../repo/userRepo";
import { status } from "../helpers/status";
import { EmailTemplateCreationAttributes } from "../models/email_template";
import { EmailTemplateRepository } from "../repo/emailTemplatesRepo";

const isValidTemplateType = (templateType: string): boolean => {
  return templateType === 'receiver-multi-trees' || templateType === 'receiver-single-tree' || templateType === 'sponsor-single-tree' || templateType === 'sponsor-multi-trees'
}


export const createEmailTemplate = async (req: Request, res: Response) => {
  const data = req.body as EmailTemplateCreationAttributes;
  if (!data.template_name || !data.event_type || !data.event_name || !data.template_type) {
    res.status(status.bad).send({
      message: "Missing required fields!"
    });
    return;
  }

  if (!isValidTemplateType(data.template_type)) {
    res.status(status.bad).send({
      message: "Invalid template type!"
    });
    return;
  }

  try {
    const result = await EmailTemplateRepository.addEmailTemplate(data);
    res.status(status.created).send(result);
  } catch (error: any) {
    console.log("[ERROR]", "emailTemplateController::createEmailTemplate", error.message);
    res.status(status.error).json({
      status: status.error,
      message: "Something went wrong. Please try again after some time!",
    });
  }
};

export const deleteEmailTemplate = async (req: Request, res: Response) => {
  const emailTemplateId = parseInt(req.params.id)
  if (isNaN(emailTemplateId)) {
    res.send(status.bad).send({
      message: "EmailTemplate id is required to delete the email template"
    });
    return;
  }

  try {
    await EmailTemplateRepository.deleteEmailTemplate(emailTemplateId);
    res.status(status.success).send({
      message: "EmailTemplate deleted successfully!"
    })
  } catch (error: any) {
    console.log("[ERROR]", "emailTemplateController::deleteEmailTemplate", error.message);
    res.status(status.error).json({
      status: status.error,
      message: "Something went wrong. Please try again after some time!",
    });
  }
};

export const getEmailTemplates = async (req: Request, res: Response) => {
  try {
    let emailTemplates = await EmailTemplateRepository.getEmailTemplates({});
    res.status(status.success).send(emailTemplates);
  } catch (error: any) {
    res.status(status.error).json({
      status: status.error,
      message: error.message,
    });
  }
};
