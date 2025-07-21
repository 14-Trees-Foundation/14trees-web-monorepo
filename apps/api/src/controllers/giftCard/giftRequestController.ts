import { Request, Response } from "express";
import { status } from "../../helpers/status";
import { Logger } from "../../helpers/logger";
import { FilterItem } from "../../models/pagination";
import { GiftCardsRepository } from "../../repo/giftCardsRepo";
import { getOffsetAndLimitFromRequest } from "../helper/request";
import { UserRepository } from "../../repo/userRepo";
import TreeRepository from "../../repo/treeRepo";
import { 
    GiftCardRequestCreationAttributes, 
    GiftCardRequestStatus, 
    GiftCardRequestAttributes,
    SponsorshipType 
} from "../../models/gift_card_request";
import { UploadFileToS3 } from "../helper/uploadtos3";
import { Op } from "sequelize";
import { VisitRepository } from "../../repo/visitsRepo";
import { PaymentRepository } from "../../repo/paymentsRepo";
import { PaymentHistory } from "../../models/payment_history";
import { ReferralsRepository } from "../../repo/referralsRepo";
import RazorpayService from "../../services/razorpay/razorpay";
import GiftRequestService from "../../facade/giftCard/giftRequestService";
import { 
    CreateGiftCardRequestBody, 
    GiftCardControllerRequest 
} from "../helper/giftCard/types";
import { GiftCardValidation } from "../helper/giftCard/validation";
import { GiftCardUtils } from "../helper/giftCard/utils";
import { GIFT_CARD_CONSTANTS } from "../helper/giftCard/constants";

export const getGiftRequestTags = async (req: Request, res: Response) => {
    try {
        const tags = await GiftRequestService.getGiftRequestTags(0, 100);
        res.status(status.success).send(tags);
    } catch (error: any) {
        await Logger.logError('giftRequestController', 'getGiftRequestTags', error, req);
        res.status(status.error).send({ error: error });
    }
}

export const getGiftCardRequests = async (req: Request, res: Response) => {
    try {
        const { offset, limit } = getOffsetAndLimitFromRequest(req);
        const filters: FilterItem[] = req.body?.filters;
        const orderBy: any[] = req.body?.order_by;

        const giftCardRequests = await GiftRequestService.getGiftCardRequestsWithPaymentStatus(
            offset, 
            limit, 
            filters, 
            orderBy
        );
        
        res.status(status.success).json(giftCardRequests);
    } catch (error: any) {
        await Logger.logError('giftRequestController', 'getGiftCardRequests', error, req);
        res.status(status.error).send({ error: error });
    }
}

export const createGiftCardRequest = async (req: GiftCardControllerRequest, res: Response) => {
    try {
        const requestBody: CreateGiftCardRequestBody = req.body;
        
        // Validate input
        const validation = GiftCardValidation.validateCreateGiftCardRequest(requestBody);
        if (!validation.isValid) {
            return res.status(status.bad).json({
                message: 'Validation failed',
                errors: validation.errors
            });
        }

        const {
            user_id: userId,
            sponsor_id: sponsorId,
            group_id: groupId,
            no_of_cards: noOfCards,
            primary_message: primaryMessage,
            secondary_message: secondaryMessage,
            event_name: eventName,
            event_type: eventType,
            category: category,
            grove: grove,
            planted_by: plantedBy,
            logo_message: logoMessage,
            request_id: requestId,
            notes: notes,
            payment_id: paymentId,
            created_by: createdBy,
            gifted_on: giftedOn,
            request_type: requestType,
            logo_url: logoUrl,
            tags,
            rfr,
            c_key,
        } = requestBody;

        // Handle visit creation if needed
        let visitId: number | null = null;
        if (requestType === GIFT_CARD_CONSTANTS.REQUEST_TYPES.VISIT) {
            const visit = await VisitRepository.addVisit({
                visit_name: GiftCardUtils.getDefaultEventName(eventName),
                visit_date: giftedOn ? giftedOn : new Date(),
                visit_type: GiftCardUtils.getVisitType(groupId),
                created_at: new Date(),
                updated_at: new Date(),
                site_id: GIFT_CARD_CONSTANTS.DEFAULT_SITE_ID,
            });
            visitId = visit.id;
        }

        // Handle payment processing
        let sponsorshipType: SponsorshipType = 'Unverified';
        let amountReceived: number = 0;
        let donationDate: Date | null = null;
        
        if (paymentId) {
            const payment: any = await PaymentRepository.getPayment(paymentId);
            if (payment && payment.payment_history) {
                const paymentHistory: PaymentHistory[] = payment.payment_history;
                const amounts = GiftCardUtils.calculateAmountsFromPaymentHistory(paymentHistory);
                amountReceived = amounts.paidAmount;
            }

            if (payment?.order_id) {
                const razorpayService = new RazorpayService();
                const payments = await razorpayService.getPayments(payment.order_id);
                payments?.forEach(item => {
                    amountReceived += Number(item.amount) / 100;
                });
            }

            if (amountReceived > 0) {
                sponsorshipType = 'Donation Received';
                donationDate = new Date();
            }
        }

        // Handle referral processing
        let rfr_id: number | null = null;
        if (rfr || c_key) {
            const references = await ReferralsRepository.getReferrals({
                rfr: rfr ? rfr : { [Op.is]: null },
                c_key: c_key ? c_key : { [Op.is]: null }
            });
            if (references.length === 1) rfr_id = references[0].id;
        }

        // Create gift card request
        const request: GiftCardRequestCreationAttributes = {
            request_id: requestId,
            user_id: userId,
            sponsor_id: sponsorId || null,
            group_id: groupId || null,
            no_of_cards: noOfCards,
            is_active: false,
            created_at: new Date(),
            updated_at: new Date(),
            logo_url: logoUrl || null,
            primary_message: primaryMessage || null,
            secondary_message: secondaryMessage || null,
            event_name: eventName || null,
            event_type: eventType || null,
            planted_by: plantedBy || null,
            logo_message: logoMessage || null,
            status: GiftCardRequestStatus.pendingPlotSelection,
            validation_errors: GiftCardValidation.getValidationErrors(groupId),
            notes: notes || null,
            payment_id: paymentId || null,
            created_by: createdBy || userId,
            category: category,
            grove: grove || null,
            gifted_on: giftedOn || new Date(),
            request_type: requestType as any || null,
            visit_id: visitId,
            sponsorship_type: sponsorshipType,
            donation_date: donationDate,
            amount_received: amountReceived,
            rfr_id: rfr_id,
            tags: tags && Array.isArray(tags) ? tags : null,
        };

        let giftCard = await GiftCardsRepository.createGiftCardRequest(request);

        // Handle file uploads
        let changed = false;
        const files = req.files as { logo?: Express.Multer.File[], csv_file?: Express.Multer.File[] };
        
        if (!logoUrl && files?.logo && files.logo.length > 0) {
            const location = await UploadFileToS3(files.logo[0].filename, "gift_cards", requestId);
            giftCard.logo_url = location;
            giftCard.validation_errors = [GIFT_CARD_CONSTANTS.VALIDATION_ERRORS.MISSING_USER_DETAILS];
            changed = true;
        }

        if (files?.csv_file && files.csv_file.length > 0) {
            const location = await UploadFileToS3(files.csv_file[0].filename, "gift_cards", requestId);
            giftCard.users_csv_file_url = location;
            changed = true;
        }

        if (changed) await giftCard.save();

        // Get updated gift card data
        const giftCards = await GiftCardsRepository.getGiftCardRequests(0, 1, [
            { columnField: "id", operatorValue: "equals", value: giftCard.id }
        ]);
        
        const responseData = {
            ...(giftCards.results[0]),
            presentation_ids: GiftCardUtils.filterNullValues((giftCards.results[0] as any).presentation_ids),
        };

        res.status(status.success).json(responseData);

        // Post-creation processing
        if (giftCard.payment_id) {
            const payment = await PaymentRepository.getPayment(giftCard.payment_id);
            if (payment && payment.order_id) {
                const razorpayService = new RazorpayService();
                await razorpayService.updateOrder(payment.order_id, { 
                    "Gift Request Id": giftCard.id.toString() 
                });
            }
        }

        // Handle spreadsheet integration for website requests
        if (GiftCardUtils.shouldAddToSpreadsheet(giftCard.request_type || undefined, giftCard.tags || undefined)) {
            try {
                const donationReceiptNumber = GiftCardUtils.generateDonationReceiptNumber(giftCard.id);
                await GiftCardsRepository.updateGiftCardRequests(
                    { donation_receipt_number: donationReceiptNumber, updated_at: new Date() }, 
                    { id: giftCard.id }
                );

                await GiftRequestService.addGiftRequestToSpreadsheet(giftCards.results[0]);
            } catch (error: any) {
                console.log("[ERROR]", "GiftRequestController::addGiftRequestToGoogleSpreadsheet", error);
            }
        }

    } catch (error: any) {
        console.log("[ERROR]", "GiftRequestController::createGiftCardRequest", error);
        await Logger.logError('giftRequestController', 'createGiftCardRequest', error, req);
        res.status(status.error).json({
            message: 'Something went wrong. Please try again later.'
        });
    }
}

export const cloneGiftCardRequest = async (req: Request, res: Response) => {
    try {
        const {
            gift_card_request_id: giftCardRequestId,
            request_id: requestId,
            created_by: createdBy,
        } = req.body;

        if (!giftCardRequestId || !requestId) {
            return res.status(status.bad).json({
                message: 'Please provide valid input details!'
            });
        }

        const resp = await GiftCardsRepository.getGiftCardRequests(0, 1, [
            { columnField: 'id', operatorValue: 'equals', value: giftCardRequestId }
        ]);
        
        if (resp.results.length === 0) {
            return res.status(status.notfound).json({
                status: status.notfound,
                message: "Gift request not found!"
            });
        }

        const giftCardRequest = resp.results[0];
        const validationErrors = GiftCardValidation.getValidationErrors(giftCardRequest.group_id);

        const request: GiftCardRequestCreationAttributes = {
            request_id: requestId,
            user_id: giftCardRequest.user_id,
            sponsor_id: giftCardRequest.sponsor_id,
            group_id: giftCardRequest.group_id,
            no_of_cards: giftCardRequest.no_of_cards,
            is_active: false,
            created_at: new Date(),
            updated_at: new Date(),
            logo_url: giftCardRequest.logo_url,
            primary_message: giftCardRequest.primary_message,
            secondary_message: giftCardRequest.secondary_message,
            event_name: giftCardRequest.event_name,
            event_type: giftCardRequest.event_type,
            planted_by: giftCardRequest.planted_by,
            logo_message: giftCardRequest.logo_message,
            status: GiftCardRequestStatus.pendingPlotSelection,
            validation_errors: validationErrors as any,
            album_id: null, 
            notes: null,
            payment_id: null,
            created_by: createdBy || giftCardRequest.user_id,
            category: giftCardRequest.category,
            grove: giftCardRequest.grove,
            gifted_on: giftCardRequest.gifted_on,
            request_type: giftCardRequest.request_type,
            visit_id: giftCardRequest.visit_id,
        };

        const createdRequest = await GiftCardsRepository.createGiftCardRequest(request);
        const giftCards = await GiftCardsRepository.getGiftCardRequests(0, 1, [
            { columnField: "id", operatorValue: "equals", value: createdRequest.id }
        ]);
        
        res.status(status.success).json(giftCards.results[0]);

    } catch (error: any) {
        console.log("[ERROR]", "GiftRequestController::cloneGiftCardRequest", error);
        await Logger.logError('giftRequestController', 'cloneGiftCardRequest', error, req);
        res.status(status.error).json({
            message: 'Something went wrong. Please try again later.'
        });
    }
}

// Helper function to update trees for gift request
const updateTreesForGiftRequest = async (giftRequestId: number, updateFields: any) => {
    let offset = 0, limit = 100;
    while (true) {
        // get trees id for gift request
        const giftCardsResp = await GiftCardsRepository.getBookedTrees(offset, limit, [
            { columnField: 'gift_card_request_id', operatorValue: 'equals', value: giftRequestId }
        ]);
        const treeIds = giftCardsResp.results.map(item => item.tree_id).filter(id => id ? true : false);

        // update booked or assigned trees
        if (treeIds.length > 0) {
            await TreeRepository.updateTrees(updateFields, { id: { [Op.in]: treeIds } });
        }

        offset += limit;
        if (offset >= Number(giftCardsResp.total)) break;
    }
}

export const updateGiftCardRequest = async (req: Request, res: Response) => {
    try {
        const giftCardRequest: GiftCardRequestAttributes = req.body;
        
        // Handle array fields sent as comma-separated strings from frontend
        if (!req.body.validation_errors) {
            giftCardRequest.validation_errors = null;
        } else {
            const validationErrors = req.body.validation_errors.split(',').filter((v: string) => v.trim() !== '');
            giftCardRequest.validation_errors = validationErrors.length > 0 ? validationErrors : null;
        }
        
        if (!req.body.tags) {
            giftCardRequest.tags = null;
        } else {
            const tags = req.body.tags.split(',').filter((t: string) => t.trim() !== '');
            giftCardRequest.tags = tags.length > 0 ? tags : null;
        }
        
        if (!req.body.mail_status) {
            giftCardRequest.mail_status = null;
        } else {
            const mailStatus = req.body.mail_status.split(',').filter((m: string) => m.trim() !== '');
            giftCardRequest.mail_status = mailStatus.length > 0 ? mailStatus : null;
        }
        
        if (!req.body.contribution_options) {
            giftCardRequest.contribution_options = null;
        } else {
            const contributionOptions = req.body.contribution_options.split(',').filter((c: string) => c.trim() !== '');
            giftCardRequest.contribution_options = contributionOptions.length > 0 ? contributionOptions : null;
        }

        if (!giftCardRequest.sponsor_id && giftCardRequest.request_type !== 'Visit') {
            return res.status(status.bad).send({
                message: "Please provide sponsor details."
            });
        }

        const resp = await GiftCardsRepository.getGiftCardRequests(0, 1, [
            { columnField: 'id', operatorValue: 'equals', value: giftCardRequest.id }
        ]);
        
        if (resp.results.length === 0) {
            return res.status(status.notfound).json({
                status: status.notfound,
                message: "Gift request not found!"
            });
        }

        const originalRequest = resp.results[0];

        if (!originalRequest.visit_id && giftCardRequest.request_type === 'Visit') {
            const visit = await VisitRepository.addVisit({
                visit_name: GiftCardUtils.getDefaultEventName(giftCardRequest.event_name || undefined),
                visit_date: giftCardRequest.gifted_on ? giftCardRequest.gifted_on : new Date(),
                visit_type: GiftCardUtils.getVisitType(giftCardRequest.group_id || undefined),
                created_at: new Date(),
                updated_at: new Date(),
                site_id: GIFT_CARD_CONSTANTS.DEFAULT_SITE_ID,
            });
            giftCardRequest.visit_id = visit.id;
        }

        const files = req.files as { logo?: Express.Multer.File[], csv_file?: Express.Multer.File[] };
        if (files?.logo && files.logo.length > 0) {
            const location = await UploadFileToS3(files.logo[0].filename, "gift_cards", giftCardRequest.request_id);
            giftCardRequest.logo_url = location;
        }
        if (giftCardRequest.logo_url) {
            giftCardRequest.validation_errors = giftCardRequest.validation_errors ? 
                giftCardRequest.validation_errors.filter(error => error !== 'MISSING_LOGO') : null;
        }

        if (files?.csv_file && files.csv_file.length > 0) {
            const location = await UploadFileToS3(files.csv_file[0].filename, "gift_cards", giftCardRequest.request_id);
            giftCardRequest.users_csv_file_url = location;
        }

        if (giftCardRequest.request_type !== 'Visit') {
            giftCardRequest.visit_id = null;
        }

        if (!giftCardRequest.sponsor_id) {
            giftCardRequest.sponsor_id = null;
        }
        if (!giftCardRequest.group_id) {
            giftCardRequest.group_id = null;
            giftCardRequest.logo_url = null;
        }

        if (giftCardRequest.request_type === 'Visit' || giftCardRequest.request_type === 'Normal Assignment') {
            giftCardRequest.planted_by = null;
        }

        if (!giftCardRequest.validation_errors || giftCardRequest.validation_errors.length === 0) {
            giftCardRequest.validation_errors = null;
        }
        
        const updatedGiftCardRequest = await GiftCardsRepository.updateGiftCardRequest(giftCardRequest);

        // Calculate payment status
        let paidAmount = 0;
        let validatedAmount = 0;
        const totalAmount = GiftCardUtils.calculateTotalAmount(
            giftCardRequest.category,
            giftCardRequest.request_type || '',
            updatedGiftCardRequest.no_of_cards
        );

        if (giftCardRequest.payment_id) {
            const payment: any = await PaymentRepository.getPayment(giftCardRequest.payment_id);
            if (payment && payment.payment_history) {
                const paymentHistory: PaymentHistory[] = payment.payment_history;
                const amounts = GiftCardUtils.calculateAmountsFromPaymentHistory(paymentHistory);
                paidAmount = amounts.paidAmount;
                validatedAmount = amounts.validatedAmount;
            }
        }

        const updateData = {
            ...updatedGiftCardRequest,
            plot_ids: GiftCardUtils.filterNullValues((updatedGiftCardRequest as any).plot_ids),
            payment_status: GiftCardUtils.calculatePaymentStatus(
                validatedAmount,
                paidAmount,
                totalAmount,
                updatedGiftCardRequest.amount_received || 0
            ),
        };

        // Handle tree updates
        let treeUpdateRequest: any = {};
        if (updatedGiftCardRequest.planted_by !== originalRequest.planted_by) {
            treeUpdateRequest = { gifted_by_name: updatedGiftCardRequest.planted_by };
        }

        if (updatedGiftCardRequest.event_name !== originalRequest.event_name) {
            treeUpdateRequest = { ...treeUpdateRequest, description: updatedGiftCardRequest.event_name };
        }

        if (updatedGiftCardRequest.group_id !== originalRequest.group_id) {
            treeUpdateRequest = { 
                ...treeUpdateRequest, 
                mapped_to_group: updatedGiftCardRequest.group_id, 
                sponsored_by_group: updatedGiftCardRequest.group_id, 
                sponsored_at: new Date() 
            };
        }

        if (updatedGiftCardRequest.user_id !== originalRequest.user_id) {
            treeUpdateRequest = { ...treeUpdateRequest, mapped_to_user: updatedGiftCardRequest.user_id };
        }

        if (updatedGiftCardRequest.sponsor_id !== originalRequest.sponsor_id) {
            treeUpdateRequest = { 
                ...treeUpdateRequest, 
                sponsored_by_user: updatedGiftCardRequest.sponsor_id, 
                sponsored_by_group: updatedGiftCardRequest.group_id, 
                sponsored_at: new Date() 
            };
        }

        if (updatedGiftCardRequest.visit_id !== originalRequest.visit_id) {
            treeUpdateRequest = { ...treeUpdateRequest, visit_id: updatedGiftCardRequest.visit_id };
        }

        if (updatedGiftCardRequest.event_type !== originalRequest.event_type) {
            treeUpdateRequest = { ...treeUpdateRequest, event_type: updatedGiftCardRequest.event_type };
        }

        if (updatedGiftCardRequest.request_type === 'Visit' || updatedGiftCardRequest.request_type === 'Normal Assignment') {
            treeUpdateRequest = { ...treeUpdateRequest, gifted_by: null, gifted_by_name: null };
        }

        if (Object.keys(treeUpdateRequest).length !== 0) {
            await updateTreesForGiftRequest(giftCardRequest.id!, treeUpdateRequest);
        }

        res.status(status.success).json(updateData);
    } catch (error: any) {
        console.log("[ERROR]", "GiftRequestController::updateGiftCardRequest", error);
        await Logger.logError('giftRequestController', 'updateGiftCardRequest', error, req);
        res.status(status.error).send({ message: 'Something went wrong. Please try again later.' });
    }
}

export const processGiftCard = async (req: Request, res: Response) => {
    try {
        const { id } = req.params;
        const { userId } = req.body;

        if (!userId) {
            return res.status(400).json({ message: 'User ID is required' });
        }

        if (!id || isNaN(Number(id))) {
            return res.status(400).json({ message: 'Invalid gift card request ID' });
        }

        // Check if gift card exists
        const giftRequestId = parseInt(id);
        const giftCardRequest = await GiftRequestService.getGiftCardsRequest(giftRequestId);

        if (!giftCardRequest) {
            return res.status(404).json({ message: 'Gift card not found' });
        }

        if (giftCardRequest.processed_by) {
            return res.status(409).json({
                message: 'Already processed by another user',
                processed_by: giftCardRequest.processed_by
            });
        }

        const updated = await GiftCardsRepository.updateGiftCardRequests(
            {
                processed_by: userId,
                updated_at: new Date()
            },
            { id, processed_by: { [Op.is]: null } }
        );

        if (!updated) {
            return res.status(409).json({ 
                message: 'Gift card already being processed by another user' 
            });
        }

        // Fetch updated gift card
        const updatedGiftCard = await GiftRequestService.getGiftCardsRequest(giftCardRequest.id);

        return res.status(200).json({
            success: true,
            giftCard: updatedGiftCard
        });

    } catch (error) {
        console.error("Error processing gift card:", error);
        await Logger.logError('giftRequestController', 'processGiftCard', error, req);
        return res.status(500).json({
            message: 'Failed to process gift card',
            error: error instanceof Error ? error.message : 'Unknown error'
        });
    }
}

export const patchGiftCardRequest = async (req: Request, res: Response) => {
    try {
        const { gift_card_request_id: giftCardRequestId, updateFields, data } = req.body;
        
        if (!giftCardRequestId || !updateFields || !Array.isArray(updateFields) || updateFields.length === 0 || !data) {
            return res.status(status.bad).send({ message: "Invalid input!" });
        }

        const giftCardRequest = await GiftCardsRepository.getGiftCardRequests(0, 1, [
            { columnField: 'id', operatorValue: 'equals', value: giftCardRequestId }
        ]);
        
        if (giftCardRequest.results.length === 0) {
            return res.status(status.notfound).json({
                status: status.notfound,
                message: "Gift request not found!"
            });
        }

        const updateData: any = {};
        updateFields.forEach((field: any) => {
            updateData[field] = data[field];
        });

        await GiftCardsRepository.updateGiftCardRequests(updateData, { id: giftCardRequestId });

        res.status(status.success).json();
    } catch (error: any) {
        console.log("[ERROR]", "GiftRequestController::patchGiftCardRequest", error);
        await Logger.logError('giftRequestController', 'patchGiftCardRequest', error, req);
        res.status(status.error).json({
            message: 'Something went wrong. Please try again later.'
        });
    }
}

export const deleteGiftCardRequest = async (req: Request, res: Response) => {
    try {
        const giftCardRequestId = parseInt(req.params.id);
        
        if (isNaN(giftCardRequestId)) {
            return res.status(status.bad).send({ message: "Gift card id is required" });
        }

        await GiftCardsRepository.deleteGiftCardRequestPlots({ gift_card_request_id: giftCardRequestId });
        const cardsResp = await GiftCardsRepository.getBookedTrees(0, -1, [
            { columnField: 'gift_card_request_id', operatorValue: 'equals', value: giftCardRequestId }
        ]);

        const treeIds: number[] = [];
        cardsResp.results.forEach(card => {
            if (card.tree_id) treeIds.push(card.tree_id);
        });

        if (treeIds.length > 0) {
            const updateConfig = {
                mapped_to_user: null,
                mapped_to_group: null,
                mapped_at: null,
                sponsored_by_user: null,
                sponsored_by_group: null,
                sponsored_at: new Date(),
                gifted_to: null,
                gifted_by: null,
                gifted_by_name: null,
                assigned_to: null,
                assigned_at: null,
                memory_images: null,
                description: null,
                planted_by: null,
                user_tree_image: null,
                event_type: null,
                visit_id: null,
                updated_at: new Date(),
            };

            await TreeRepository.updateTrees(updateConfig, { id: { [Op.in]: treeIds } });
            await GiftCardsRepository.deleteGiftCards({ 
                gift_card_request_id: giftCardRequestId, 
                tree_id: { [Op.in]: treeIds } 
            });
        }

        // delete gift request plots
        await GiftCardsRepository.deleteGiftCardRequestPlots({ gift_card_request_id: giftCardRequestId });

        await GiftCardsRepository.deleteGiftRequestUsers({ gift_request_id: giftCardRequestId });

        const resp = await GiftCardsRepository.deleteGiftCardRequest(giftCardRequestId);
        console.log(`Deleted Gift card with id: ${req.params.id}`, resp);
        res.status(status.success).json("Gift card deleted successfully");
    } catch (error: any) {
        console.log("[ERROR]", "GiftRequestController::deleteGiftCardRequest", error);
        await Logger.logError('giftRequestController', 'deleteGiftCardRequest', error, req);
        res.status(status.error).json({
            status: status.error,
            message: error.message,
        });
    }
}