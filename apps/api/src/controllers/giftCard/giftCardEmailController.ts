import { Request, Response } from "express";
import { status } from "../../helpers/status";
import { Logger } from "../../helpers/logger";
import GiftCardEmailService from "../../facade/giftCard/giftCardEmailService";

/**
 * Gift Card Email Controller
 * Handles HTTP requests for gift card email operations
 */

/**
 * Send emails for gift card request
 * POST /gift-card-requests/:id/send-email
 */
export const sendEmailForGiftCardRequest = async (req: Request, res: Response) => {
    const {
        gift_card_request_id: giftCardRequestId,
        test_mails: testMails,
        receiver_cc_mails: receiverCC,
        sponsor_cc_mails: sponsorCC,
        attach_card,
        event_type: eventType,
        email_sponsor: emailSponsor,
        email_receiver: emailReceiver,
        email_assignee: emailAssignee,
    } = req.body;

    if (!giftCardRequestId) {
        return res.status(status.bad).json({
            message: 'Please provide valid input details!'
        });
    }

    try {
        console.log('[INFO] Processing email request for gift card:', giftCardRequestId);

        await GiftCardEmailService.sendEmailsForGiftCardRequest(giftCardRequestId, {
            testMails,
            receiverCC,
            sponsorCC,
            attachCard: attach_card,
            eventType,
            emailSponsor,
            emailReceiver,
            emailAssignee
        });

        res.status(status.success).send();
        
        console.log('[INFO] Email request processed successfully for gift card:', giftCardRequestId);

    } catch (error: any) {
        console.error("[ERROR] GiftCardEmailController::sendEmailForGiftCardRequest", {
            error,
            stack: error instanceof Error ? error.stack : undefined,
            giftCardRequestId
        });

        await Logger.logError('giftCardEmailController', 'sendEmailForGiftCardRequest', error, req);

        // Handle specific error messages
        if (error.message.includes('already sent') || error.message.includes('not found')) {
            return res.status(status.success).json({ message: error.message });
        }

        res.status(status.bad).send({ 
            message: 'Something went wrong. Please try again later.' 
        });
    }
};

/**
 * Send custom email to sponsor
 * POST /gift-card-requests/:id/send-custom-email
 */
export const sendCustomEmail = async (req: Request, res: Response) => {
    const {
        gift_request_id,
        template_name,
        test_emails,
        attachments,
        attach_cards,
        subject,
    } = req.body;

    if (!gift_request_id || !template_name) {
        return res.status(status.bad).json({
            message: 'Please provide valid input details!'
        });
    }

    try {
        console.log('[INFO] Sending custom email for gift request:', gift_request_id);

        await GiftCardEmailService.sendCustomEmailToSponsor(gift_request_id, template_name, {
            testEmails: test_emails,
            attachments,
            attachCards: attach_cards,
            subject
        });

        res.status(status.success).send();
        
        console.log('[INFO] Custom email sent successfully for gift request:', gift_request_id);

    } catch (error: any) {
        console.error("[ERROR] GiftCardEmailController::sendCustomEmail", {
            error,
            stack: error instanceof Error ? error.stack : undefined,
            giftRequestId: gift_request_id
        });

        await Logger.logError('giftCardEmailController', 'sendCustomEmail', error, req);

        return res.status(status.error).send({
            message: 'Something went wrong. Please try again later.'
        });
    }
};

/**
 * Get email status for gift card request
 * GET /gift-card-requests/:id/email-status
 */
export const getEmailStatus = async (req: Request, res: Response) => {
    const { gift_card_request_id } = req.params;

    if (!gift_card_request_id || isNaN(parseInt(gift_card_request_id))) {
        return res.status(status.bad).json({
            message: 'Please provide valid gift card request ID!'
        });
    }

    try {
        const emailStatus = await GiftCardEmailService.getEmailStatus(parseInt(gift_card_request_id));
        
        res.status(status.success).json(emailStatus);

    } catch (error: any) {
        console.error("[ERROR] GiftCardEmailController::getEmailStatus", {
            error,
            stack: error instanceof Error ? error.stack : undefined,
            giftCardRequestId: gift_card_request_id
        });

        await Logger.logError('giftCardEmailController', 'getEmailStatus', error, req);

        res.status(status.error).send({
            message: 'Something went wrong. Please try again later.'
        });
    }
};

/**
 * Send sponsor emails only
 * POST /gift-card-requests/:id/send-sponsor-email
 */
export const sendSponsorEmails = async (req: Request, res: Response) => {
    const { gift_card_request_id } = req.params;
    const { event_type = 'default', attach_card = false, cc_mails, test_mails } = req.body;

    if (!gift_card_request_id || isNaN(parseInt(gift_card_request_id))) {
        return res.status(status.bad).json({
            message: 'Please provide valid gift card request ID!'
        });
    }

    try {
        await GiftCardEmailService.sendSponsorEmails(
            parseInt(gift_card_request_id),
            event_type,
            attach_card,
            cc_mails,
            test_mails
        );

        res.status(status.success).send();

    } catch (error: any) {
        console.error("[ERROR] GiftCardEmailController::sendSponsorEmails", error);
        await Logger.logError('giftCardEmailController', 'sendSponsorEmails', error, req);

        res.status(status.error).send({
            message: 'Something went wrong. Please try again later.'
        });
    }
};

/**
 * Send receiver emails only
 * POST /gift-card-requests/:id/send-receiver-email
 */
export const sendReceiverEmails = async (req: Request, res: Response) => {
    const { gift_card_request_id } = req.params;
    const { event_type = 'default', attach_card = false, cc_mails, test_mails } = req.body;

    if (!gift_card_request_id || isNaN(parseInt(gift_card_request_id))) {
        return res.status(status.bad).json({
            message: 'Please provide valid gift card request ID!'
        });
    }

    try {
        await GiftCardEmailService.sendReceiverEmails(
            parseInt(gift_card_request_id),
            event_type,
            attach_card,
            cc_mails,
            test_mails
        );

        res.status(status.success).send();

    } catch (error: any) {
        console.error("[ERROR] GiftCardEmailController::sendReceiverEmails", error);
        await Logger.logError('giftCardEmailController', 'sendReceiverEmails', error, req);

        res.status(status.error).send({
            message: 'Something went wrong. Please try again later.'
        });
    }
};

/**
 * Send assignee emails only
 * POST /gift-card-requests/:id/send-assignee-email
 */
export const sendAssigneeEmails = async (req: Request, res: Response) => {
    const { gift_card_request_id } = req.params;
    const { event_type = 'default', attach_card = false, cc_mails, test_mails } = req.body;

    if (!gift_card_request_id || isNaN(parseInt(gift_card_request_id))) {
        return res.status(status.bad).json({
            message: 'Please provide valid gift card request ID!'
        });
    }

    try {
        await GiftCardEmailService.sendAssigneeEmails(
            parseInt(gift_card_request_id),
            event_type,
            attach_card,
            cc_mails,
            test_mails
        );

        res.status(status.success).send();

    } catch (error: any) {
        console.error("[ERROR] GiftCardEmailController::sendAssigneeEmails", error);
        await Logger.logError('giftCardEmailController', 'sendAssigneeEmails', error, req);

        res.status(status.error).send({
            message: 'Something went wrong. Please try again later.'
        });
    }
};