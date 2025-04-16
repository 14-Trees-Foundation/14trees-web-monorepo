import { Request, Response } from "express";
import { getOffsetAndLimitFromRequest } from "./helper/request";
import { status } from "../helpers/status";
import { GRTransactionsRepository } from "../repo/giftRedeemTransactionsRepo";
import { TemplateType } from "aws-sdk/clients/iot";
import { EmailTemplateRepository } from "../repo/emailTemplatesRepo";
import GiftRequestHelper from "../helpers/giftRequests";
import * as transactionService from "../facade/transactionService";
import { GiftCardsRepository } from "../repo/giftCardsRepo";
import { Op } from "sequelize";

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

export const updateTransaction = async (req: Request, res: Response) => {
    const { transaction_id, mask, data } = req.body;

    if (!transaction_id || isNaN(parseInt(transaction_id))) {
        return res.status(status.bad).send({ message: "Invalid request. Please provide valid transaction id!" });
    }

    if (!mask || !Array.isArray(mask) || mask.length === 0) {
        return res.status(status.bad).send({ message: "Invalid request. Please provide valid mask array!" });
    }

    if (!data || typeof data !== 'object') {
        return res.status(status.bad).send({ message: "Invalid request. Please provide valid data object!" });
    }

    try {
        const result = await transactionService.processTransactionUpdate(
            parseInt(transaction_id),
            mask,
            data
        );

        if (!result.success) {
            return res.status(status.bad).send({ message: result.message });
        }

        res.status(status.success).send({
            message: "Transaction updated successfully",
            updated_fields: result.updatedUserFields?.length 
                ? [...result.updatedTransactionFields, 'user_data']
                : result.updatedTransactionFields,
            trees_updated: result.treesUpdated,
            trees_update_count: result.treesUpdateCount
        });
    } catch (error: any) {
        console.log("[ERROR]", "transactionsController::updateTransaction", error);
        res.status(status.error).json({
            status: status.error,
            message: error.message,
        });
    }
}


export const getTrancationTreeCardImages = async (req: Request, res: Response) => {
    const { transaction_id } = req.params;
    const transactionId = parseInt(transaction_id);
    if (!transactionId || isNaN(transactionId)) {
        return res.status(status.bad).send({ message: "Invalid request. Please provide valid transaction id!" });
    }

    try {
        const cardIds = await GRTransactionsRepository.getTransactionGiftCardIds(transactionId);
        const cards = await GiftCardsRepository.getGiftCards(0, -1, { id: { [Op.in]: cardIds } });
        const imageUrls = cards.results.map(card => card.card_image_url).filter(url => url);
        res.status(status.success).send(imageUrls);
    } catch (error: any) {
        console.log("[ERROR]", "transactionsController::getTrancationTreeCardImages", error);
        res.status(status.error).json({
            status: status.error,
            message: "Something went wrong. Please try again later.",
        });
    }
}