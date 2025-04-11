import { Request, Response } from "express";
import { getOffsetAndLimitFromRequest } from "./helper/request";
import { status } from "../helpers/status";
import { GRTransactionsRepository } from "../repo/giftRedeemTransactionsRepo";
import { TemplateType } from "aws-sdk/clients/iot";
import { EmailTemplateRepository } from "../repo/emailTemplatesRepo";
import GiftRequestHelper from "../helpers/giftRequests";

export const getTransactions = async (req: Request, res: Response) => {
    const { offset, limit } = getOffsetAndLimitFromRequest(req);
    const { id } = req.params
    const { search, type } = req.query

    if (type !== 'group' && type !== 'user') {
        return res.status(status.bad).send({ message: "Invalid request. Please provide valid type!" })
    }

    if (!id || isNaN(parseInt(id))) {
        return res.status(status.bad).send({ message: `Invalid request. Please provide valid ${type} id!` })
    }

    try {
        let result = await GRTransactionsRepository.getDetailsTransactions(offset, limit, type, parseInt(id), search as string);
        res.status(status.success).send(result);
    } catch (error: any) {
        res.status(status.error).json({
            status: status.error,
            message: error.message,
        });
    }
}

export const sendEmailForTransaction = async (req: Request, res: Response) => {
    const { transaction_id, event_type, recipient_email, cc_emails } = req.body;
    if (!transaction_id || isNaN(parseInt(transaction_id))) {
        return res.status(status.bad).send({ message: "Invalid request. Please provide valid transaction id!" })
    }

    try {
        const transaction: any = await GRTransactionsRepository.getDetailedTransactionById(transaction_id);
        if (transaction.mail_sent) {
            return res.status(status.success).send({ message: "Email already sent!" });
        }

        let trees = await GRTransactionsRepository.getTransactionTrees(transaction_id);
        const templateType: TemplateType = trees.length > 1 ? 'receiver-multi-trees' : 'receiver-single-tree';
        const templates = await EmailTemplateRepository.getEmailTemplates({ event_type: event_type, template_type: templateType })
        if (templates.length === 0) {
            console.log("[ERROR]", "giftCardsController::sendEmailForGiftCardRequest", "Email template not found");
            throw new Error("Email template not found");
        }

        const template = templates[0];

        const emailData = {
            trees: trees.map(tree => ({
                sapling_id: tree.sapling_id,
                dashboard_link: 'https://dashboard.14trees.org/profile/' + tree.sapling_id,
                planted_via: transaction.gifted_by,
                plant_type: tree.plant_type,
                scientific_name: tree.scientific_name,
                card_image_url: tree.card_image_url,
                event_name: transaction.event_name,
                assigned_to_name: transaction.recipient_name,
            })),
            assigned_to_name: transaction.recipient_name,
            user_email: recipient_email,
            user_name: transaction.recipient_name,
            event_name: transaction.occasion_name,
            group_name: transaction.group_name,
            company_logo_url: null,
            assigned_to: transaction.recipient,
            gifted_to: transaction.recipient,
            self: true,
            relation: null,
            relational: undefined,
            memorial: transaction.event_type == "2" ? true : undefined,
            count: trees.length
        }

        const statusMessage = await GiftRequestHelper.emailReceiver(emailData, event_type, template.template_name, true, cc_emails, undefined, transaction.gifted_by, transaction.group_name);
        await GRTransactionsRepository.updateTransactions({
            mail_sent: statusMessage === '' ? true : false,
            mail_error: statusMessage ? statusMessage : null,
            mail_sent_at: new Date(),
            updated_at: new Date()
        }, {
            id: transaction_id
        });

        res.status(status.success).send(statusMessage);
    } catch (error: any) {
        res.status(status.error).json({
            status: status.error,
            message: error.message,
        });
    }
}
