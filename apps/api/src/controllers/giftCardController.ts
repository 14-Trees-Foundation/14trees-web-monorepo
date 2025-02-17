import { Request, Response } from "express";
import { status } from "../helpers/status";
import { FilterItem } from "../models/pagination";
import { GiftCardsRepository } from "../repo/giftCardsRepo";
import { getOffsetAndLimitFromRequest } from "./helper/request";
import { UserRepository } from "../repo/userRepo";
import { GiftCardRequestAttributes, GiftCardRequestCreationAttributes, GiftCardRequestStatus, GiftCardRequestValidationError } from "../models/gift_card_request";
import TreeRepository from "../repo/treeRepo";
import { updateSlide } from "./helper/slides";
import { UploadFileToS3, uploadBase64DataToS3 } from "./helper/uploadtos3";
import archiver from 'archiver';
import axios from 'axios'
import { Op } from "sequelize";
import { downloadSlide } from "../services/google";
import { sendDashboardMail } from "../services/gmail/gmail";
import { AlbumRepository } from "../repo/albumRepo";
import { UserRelationRepository } from "../repo/userRelationsRepo";
import { EmailTemplateRepository } from "../repo/emailTemplatesRepo";
import { TemplateType } from "../models/email_template";
import { GiftRequestUser, GiftRequestUserAttributes, GiftRequestUserCreationAttributes } from "../models/gift_request_user";
import { GiftCard } from "../models/gift_card";
import { PaymentRepository } from "../repo/paymentsRepo";
import { PaymentHistory } from "../models/payment_history";
import { GroupRepository } from "../repo/groupRepo";
import moment from "moment";
import { formatNumber, numberToWords } from "../helpers/utils";
import { generateFundRequestPdf } from "../services/invoice/generatePdf";
import { UserGroupRepository } from "../repo/userGroupRepo";
import { autoAssignTrees, generateGiftCardsForGiftRequest, generateGiftCardTemplate, sendMailsToReceivers, sendMailsToSponsors } from "./helper/giftRequestHelper";

export const getGiftRequestTags = async (req: Request, res: Response) => {
    try {
        const tags = await GiftCardsRepository.getGiftRequestTags(0, 100);
        res.status(status.success).send(tags);
    } catch (error: any) {
        console.log("[ERROR]", "PlantTypeController::getGiftRequestTags", error);
        res.status(status.error).send({ message: "Something went wrong. Please try again after some time" });
    }
}

export const getGiftCardRequests = async (req: Request, res: Response) => {
    const { offset, limit } = getOffsetAndLimitFromRequest(req);
    const filters: FilterItem[] = req.body?.filters;
    const orderBy: any[] = req.body?.order_by;

    const giftCardRequests = await GiftCardsRepository.getGiftCardRequests(offset, limit, filters, orderBy);
    const data: any[] = [];
    for (const giftCardRequest of giftCardRequests.results) {
        let paidAmount = 0;
        let validatedAmount = 0;
        const totalAmount =
            (giftCardRequest.request_type === 'Normal Assignment'
                ? giftCardRequest.category === 'Foundation'
                    ? 3000
                    : 1500
                : 2000
            ) * giftCardRequest.no_of_cards;

        if (giftCardRequest.payment_id) {
            const payment: any = await PaymentRepository.getPayment(giftCardRequest.payment_id);
            if (payment && payment.payment_history) {
                const paymentHistory: PaymentHistory[] = payment.payment_history;
                paymentHistory.forEach(payment => {
                    if (payment.status !== 'payment_not_received') paidAmount += payment.amount;
                    if (payment.status === 'validated') validatedAmount += payment.amount;
                })
            }
        }

        data.push({
            ...giftCardRequest,
            plot_ids: (giftCardRequest as any).plot_ids.filter((plot_id: any) => plot_id !== null),
            presentation_ids: (giftCardRequest as any).presentation_ids.filter((presentation_id: any) => presentation_id !== null),
            payment_status: validatedAmount === totalAmount
                ? "Fully paid"
                : validatedAmount < paidAmount
                    ? "Pending validation"
                    : paidAmount === 0
                        ? "Pending payment"
                        : "Partially paid",
        })

    }
    giftCardRequests.results = data;
    res.status(status.success).json(giftCardRequests);
}

export const createGiftCardRequest = async (req: Request, res: Response) => {
    const {
        user_id: userId,
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
    } = req.body;

    if (!userId || !noOfCards) {
        res.status(status.bad).json({
            message: 'Please provide valid input details!'
        })
    }

    const request: GiftCardRequestCreationAttributes = {
        request_id: requestId,
        user_id: userId,
        group_id: groupId || null,
        no_of_cards: noOfCards,
        is_active: false,
        created_at: new Date(),
        updated_at: new Date(),
        logo_url: null,
        primary_message: primaryMessage || null,
        secondary_message: secondaryMessage || null,
        event_name: eventName || null,
        event_type: eventType || null,
        planted_by: plantedBy || null,
        logo_message: logoMessage || null,
        status: GiftCardRequestStatus.pendingPlotSelection,
        validation_errors: groupId ? ['MISSING_LOGO', 'MISSING_USER_DETAILS'] : ['MISSING_USER_DETAILS'],
        notes: notes || null,
        payment_id: paymentId || null,
        created_by: createdBy || userId,
        category: category,
        grove: grove,
        gifted_on: giftedOn,
        request_type: requestType ? requestType : null,
    }

    try {
        let giftCard = await GiftCardsRepository.createGiftCardRequest(request);

        let changed = false;
        const files: { logo: Express.Multer.File[], csv_file: Express.Multer.File[] } = req.files as any;
        if (files.logo && files.logo.length > 0) {
            const location = await UploadFileToS3(files.logo[0].filename, "gift_cards", requestId);
            giftCard.logo_url = location;
            giftCard.validation_errors = ['MISSING_USER_DETAILS']
            changed = true;
        }

        if (files.csv_file && files.csv_file.length > 0) {
            const location = await UploadFileToS3(files.csv_file[0].filename, "gift_cards", requestId);
            giftCard.users_csv_file_url = location;
            changed = true;
        }

        if (changed) await giftCard.save();

        const giftCards = await GiftCardsRepository.getGiftCardRequests(0, 1, [{ columnField: "id", operatorValue: "equals", value: giftCard.id }])
        res.status(status.success).json(giftCards.results[0]);

    } catch (error: any) {
        console.log("[ERROR]", "GiftCardController::createGiftCardRequest", error);
        res.status(status.error).json({
            message: 'Something went wrong. Please try again later.'
        })
    }
}

export const cloneGiftCardRequest = async (req: Request, res: Response) => {
    const {
        gift_card_request_id: giftCardRequestId,
        request_id: requestId,
        created_by: createdBy,
    } = req.body;

    if (!giftCardRequestId || !requestId) {
        res.status(status.bad).json({
            message: 'Please provide valid input details!'
        })
    }

    try {

        const resp = await GiftCardsRepository.getGiftCardRequests(0, 1, [{ columnField: 'id', operatorValue: 'equals', value: giftCardRequestId }]);
        if (resp.results.length === 0) {
            res.status(status.notfound).json({
                status: status.notfound,
                message: "Gif request not found!"
            });
            return;
        }

        let giftCardRequest = resp.results[0];
        let validationErrors: GiftCardRequestValidationError[] = ['MISSING_USER_DETAILS'];
        if (giftCardRequest.group_id && !giftCardRequest.logo_url) {
            validationErrors = ['MISSING_LOGO', 'MISSING_USER_DETAILS'];
        }

        const request: GiftCardRequestCreationAttributes = {
            request_id: requestId,
            user_id: giftCardRequest.user_id,
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
            validation_errors: validationErrors,
            album_id: giftCardRequest.album_id,
            notes: null,
            payment_id: null,
            created_by: createdBy || giftCardRequest.user_id,
            category: giftCardRequest.category,
            grove: giftCardRequest.grove,
            gifted_on: giftCardRequest.gifted_on,
            request_type: giftCardRequest.request_type,
        }

        let createdRequest = await GiftCardsRepository.createGiftCardRequest(request);
        const giftCards = await GiftCardsRepository.getGiftCardRequests(0, 1, [{ columnField: "id", operatorValue: "equals", value: createdRequest.id }])
        res.status(status.success).json(giftCards.results[0]);

    } catch (error: any) {
        console.log("[ERROR]", "GiftCardController::cloneGiftCardRequest", error);
        res.status(status.error).json({
            message: 'Something went wrong. Please try again later.'
        })
    }
}

const updateTreesForGiftRequest = async (giftRequestId: number, updateFields: any) => {

    let offset = 0, limit = 100;
    while (true) {

        // get trees id for gift request
        const giftCardsResp = await GiftCardsRepository.getBookedTrees(giftRequestId, offset, limit);
        const treeIds = giftCardsResp.results.map(item => item.tree_id).filter(id => id ? true : false);

        // update booked or assigned trees
        if (treeIds.length > 0) await TreeRepository.updateTrees(updateFields, { id: { [Op.in]: treeIds } })

        offset += limit;
        if (offset >= Number(giftCardsResp.total)) break;
    }
}

export const updateGiftCardRequest = async (req: Request, res: Response) => {

    const giftCardRequest: GiftCardRequestAttributes = req.body;
    if (!req.body.validation_errors) giftCardRequest.validation_errors = null;
    else giftCardRequest.validation_errors = req.body.validation_errors?.split(',') ?? null
    if (req.body.tags) giftCardRequest.tags = req.body.tags?.split(',') ?? null;

    try {
        const resp = await GiftCardsRepository.getGiftCardRequests(0, 1, [{ columnField: 'id', operatorValue: 'equals', value: giftCardRequest.id }]);
        if (resp.results.length === 0) {
            res.status(status.notfound).json({
                status: status.notfound,
                message: "Gif request not found!"
            });
            return;
        }

        const originalRequest = resp.results[0];

        const files: { logo: Express.Multer.File[], csv_file: Express.Multer.File[] } = req.files as any;
        if (files.logo && files.logo.length > 0) {
            const location = await UploadFileToS3(files.logo[0].filename, "gift_cards", giftCardRequest.request_id);
            giftCardRequest.logo_url = location;
            giftCardRequest.validation_errors = giftCardRequest.validation_errors ? giftCardRequest.validation_errors.filter(error => error !== 'MISSING_LOGO') : null;
        }

        if (files.csv_file && files.csv_file.length > 0) {
            const location = await UploadFileToS3(files.csv_file[0].filename, "gift_cards", giftCardRequest.request_id);
            giftCardRequest.users_csv_file_url = location;
        }

        if (!giftCardRequest.validation_errors || giftCardRequest.validation_errors.length === 0) giftCardRequest.validation_errors = null;
        const updatedGiftCardRequest = await GiftCardsRepository.updateGiftCardRequest(giftCardRequest);

        let paidAmount = 0;
        let validatedAmount = 0;
        const totalAmount =
            (updatedGiftCardRequest.request_type === 'Normal Assignment'
                ? updatedGiftCardRequest.category === 'Foundation'
                    ? 3000
                    : 1500
                : 2000
            ) * updatedGiftCardRequest.no_of_cards;

        if (giftCardRequest.payment_id) {
            const payment: any = await PaymentRepository.getPayment(giftCardRequest.payment_id);
            if (payment && payment.payment_history) {
                const paymentHistory: PaymentHistory[] = payment.payment_history;
                paymentHistory.forEach(payment => {
                    if (payment.status !== 'payment_not_received') paidAmount += payment.amount;
                    if (payment.status === 'validated') validatedAmount += payment.amount;
                })
            }
        }

        const updateData = {
            ...updatedGiftCardRequest,
            plot_ids: (updatedGiftCardRequest as any).plot_ids.filter((plot_id: any) => plot_id !== null),
            payment_status: validatedAmount === totalAmount
                ? "Fully paid"
                : validatedAmount < paidAmount
                    ? "Pending validation"
                    : paidAmount === 0
                        ? "Pending payment"
                        : "Partially paid",
        }

        let treeUpdateRequest: any = {};
        if (updatedGiftCardRequest.planted_by !== originalRequest.planted_by) {
            treeUpdateRequest = { gifted_by_name: updatedGiftCardRequest.planted_by };
        }

        if (updatedGiftCardRequest.event_name !== originalRequest.event_name) {
            treeUpdateRequest = { ...treeUpdateRequest, description: updatedGiftCardRequest.event_name }
        }

        if (updatedGiftCardRequest.group_id !== originalRequest.group_id) {
            treeUpdateRequest = { ...treeUpdateRequest, mapped_to_group: updatedGiftCardRequest.group_id }
        }

        if (updatedGiftCardRequest.user_id !== originalRequest.user_id) {
            treeUpdateRequest = { ...treeUpdateRequest, mapped_to_user: updatedGiftCardRequest.user_id }
        }

        if (updatedGiftCardRequest.event_type !== originalRequest.event_type) {
            treeUpdateRequest = { ...treeUpdateRequest, event_type: updatedGiftCardRequest.event_type }
        }

        if (Object.keys(treeUpdateRequest).length !== 0) {
            await updateTreesForGiftRequest(giftCardRequest.id, treeUpdateRequest);
        }

        res.status(status.success).json(updateData);
    } catch (error: any) {
        console.log("[ERROR]", "GiftCardController::updateGiftCardRequest", error);
        res.status(status.bad).send({ message: 'Something went wrong. Please try again later.' });
    }
};

export const deleteGiftCardRequest = async (req: Request, res: Response) => {
    const giftCardRequestId = parseInt(req.params.id)
    if (isNaN(giftCardRequestId)) {
        res.status(status.bad).send({ message: "Gift card id is required" });
        return;
    }
    try {
        await GiftCardsRepository.deleteGiftCardRequestPlots({ gift_card_request_id: giftCardRequestId })
        const cardsResp = await GiftCardsRepository.getBookedTrees(giftCardRequestId, 0, -1);

        const treeIds: number[] = [];
        cardsResp.results.forEach(card => {
            if (card.tree_id) treeIds.push(card.tree_id);
        })

        const unMapTreeRequest = {
            mapped_to_user: null,
            mapped_to_group: null,
            mapped_at: null,
            updated_at: new Date(),
        }
        if (treeIds.length > 0) await TreeRepository.updateTrees(unMapTreeRequest, { id: { [Op.in]: treeIds } })

        await GiftCardsRepository.deleteGiftCards({ gift_card_request_id: giftCardRequestId })

        let resp = await GiftCardsRepository.deleteGiftCardRequest(giftCardRequestId);
        console.log(`Deleted Gift card with id: ${req.params.id}`, resp);
        res.status(status.success).json("Gift card deleted successfully");
    } catch (error: any) {
        res.status(status.error).json({
            status: status.error,
            message: error.message,
        });
    }
};

export const updateGiftCardRequestAlbum = async (req: Request, res: Response) => {
    const { gift_card_request_id: giftCardRequestId, album_id: albumId } = req.body;
    if (!giftCardRequestId) {
        res.status(status.bad).send({ message: "Invalid input!" });
        return;
    }

    try {

        let memoryImageUrls: string[] | null = [];
        if (albumId) {
            const albums = await AlbumRepository.getAlbums({ id: albumId });
            if (albums.length === 1) {
                memoryImageUrls = albums[0].images
            }
        }


        const giftCardRequestResp = await GiftCardsRepository.getGiftCardRequests(0, 1, [{ columnField: 'id', operatorValue: 'equals', value: giftCardRequestId }]);
        if (giftCardRequestResp.results.length === 1) {
            const giftCardRequest = giftCardRequestResp.results[0];
            giftCardRequest.album_id = albumId || null;
            giftCardRequest.updated_at = new Date();
            await GiftCardsRepository.updateGiftCardRequest(giftCardRequest);

            const updateMemoryImages = {
                memory_images: memoryImageUrls,
                updated_at: new Date(),
            }

            await updateTreesForGiftRequest(giftCardRequest.id, updateMemoryImages);
        }

        res.status(status.success).send();
    } catch (error: any) {
        console.log("[ERROR]", "GiftCardController::updateGiftCardRequestAlbum", error);
        res.status(status.error).json({
            status: status.error,
            message: error.message,
        });
    }
};

// TODO: Not required. Remove this.
const resetGiftCardUsersForRequest = async (giftCardRequestId: number) => {
    // delete plot selection
    await GiftCardsRepository.deleteGiftCardRequestPlots({ gift_card_request_id: giftCardRequestId })

    const cardsResp = await GiftCardsRepository.getBookedTrees(giftCardRequestId, 0, -1);

    const treeIds: number[] = [];
    const cardIds: number[] = [];
    cardsResp.results.forEach(card => {
        if (card.tree_id) treeIds.push(card.tree_id);
        cardIds.push(card.id);
    })

    const unMapTreeRequest = {
        mapped_to_user: null,
        mapped_to_group: null,
        mapped_at: null,
        assigned_to: null,
        assigned_at: null,
        description: null,
        user_tree_image: null,
        planted_by: null,
        gifted_by_name: null,
        updated_at: new Date(),
    }

    // reset the assignment
    if (treeIds.length > 0) await TreeRepository.updateTrees(unMapTreeRequest, { id: { [Op.in]: treeIds } })

    // reset gift card templates
    if (cardIds.length > 0) await GiftCardsRepository.deleteGiftCardTemplates({ gift_card_id: { [Op.in]: cardIds } })

    // delete gift card users
    await GiftCardsRepository.deleteGiftCards({ gift_card_request_id: giftCardRequestId })
}

export const getGiftRequestUsers = async (req: Request, res: Response) => {
    const giftCardRequestId = parseInt(req.params.gift_card_request_id)
    if (isNaN(giftCardRequestId)) {
        res.status(status.bad).send({ message: "Tree card request id is required" });
        return;
    }

    try {
        const giftCardRequestUsers = await GiftCardsRepository.getGiftRequestUsers(giftCardRequestId)
        res.status(status.success).json(giftCardRequestUsers)
    } catch (error: any) {
        console.log("[ERROR]", "GiftCardController::getGiftRequestUsers", error);
        res.status(status.error).json({
            message: 'Something went wrong. Please try again later.'
        })
    }
}

const upsertGiftRequestUsersAndRelations = async (users: any[], giftCardRequestId: number) => {
    const addUsersData: GiftRequestUserCreationAttributes[] = []
    const updateUsersData: GiftRequestUserAttributes[] = []
    let count = 0;
    for (const user of users) {

        // gifted To
        const recipientUser = {
            id: user.recipient,
            name: user.recipient_name,
            email: user.recipient_email,
            phone: user.recipient_phone,
        }
        const recipient = await UserRepository.upsertUser(recipientUser);

        // assigned To
        const assigneeUser = {
            id: user.assignee,
            name: user.assignee_name,
            email: user.assignee_email,
            phone: user.assignee_phone,
        }
        const assignee = await UserRepository.upsertUser(assigneeUser);

        if (recipient.id !== assignee.id && user.relation?.trim()) {
            await UserRelationRepository.createUserRelation({
                primary_user: recipient.id,
                secondary_user: assignee.id,
                relation: user.relation.trim(),
                created_at: new Date(),
                updated_at: new Date(),
            })
        }

        if (user.id) {
            updateUsersData.push({
                ...user,
                gift_request_id: giftCardRequestId,
                recipient: recipient.id,
                assignee: assignee.id,
                profile_image_url: user.image_url || null,
                updated_at: new Date(),
            })
        } else {
            addUsersData.push({
                ...user,
                gift_request_id: giftCardRequestId,
                recipient: recipient.id,
                assignee: assignee.id,
                profile_image_url: user.image_url || null,
                created_at: new Date(),
                updated_at: new Date(),
            })
        }

        count += parseInt(user.gifted_trees) || 1;
    }

    return { addUsersData, updateUsersData, count };
}

const deleteGiftRequestUsersAndResetTrees = async (deleteIds: number[], giftCards: GiftCard[], giftCardRequestId: number) => {
    const treeIds = giftCards.filter(item => item.gift_request_user_id && item.tree_id && deleteIds.includes(item.gift_request_user_id)).map(item => item.tree_id);
    await TreeRepository.updateTrees({
        description: null,
        assigned_to: null,
        assigned_at: null,
        gifted_to: null,
        gifted_by: null,
        planted_by: null,
        gifted_by_name: null,
        event_type: null,
        user_tree_image: null,
        memory_images: null,
        updated_at: new Date()
    }, { id: { [Op.in]: treeIds } });

    await GiftCardsRepository.updateGiftCards({ gift_request_user_id: null }, { gift_card_request_id: giftCardRequestId, gift_request_user_id: { [Op.in]: deleteIds } });
    await GiftCardsRepository.deleteGiftRequestUsers({ id: { [Op.in]: deleteIds } });
}

export const upsertGiftRequestUsers = async (req: Request, res: Response) => {
    const { gift_card_request_id: giftCardRequestId, users } = req.body;

    if (!giftCardRequestId || !users || users.length === 0) {
        res.status(status.bad).json({
            message: 'Please provide valid input details!'
        });
        return;
    }

    try {

        const resp = await GiftCardsRepository.getGiftCardRequests(0, 1, [{ columnField: 'id', value: giftCardRequestId, operatorValue: 'equals' }])
        const giftCardRequest: GiftCardRequestAttributes = resp.results[0];

        const cardsResp = await GiftCardsRepository.getBookedTrees(giftCardRequestId, 0, -1);
        const giftCards = cardsResp.results;

        const { addUsersData, updateUsersData, count } = await upsertGiftRequestUsersAndRelations(users, giftCardRequestId);

        if (count > giftCardRequest.no_of_cards) {
            res.status(status.bad).json({
                status: status.bad,
                message: "Requested number of gift trees doesn't match in user details!"
            })
            return;
        }

        const existingUsers = await GiftCardsRepository.getGiftRequestUsers(giftCardRequestId);
        const deleteIds = existingUsers.filter(item => users.findIndex((user: any) => user.id === item.id) === -1).map(item => item.id);
        if (deleteIds.length > 0) {
            await deleteGiftRequestUsersAndResetTrees(deleteIds, giftCards, giftCardRequestId);
        }

        if (addUsersData.length > 0) await GiftCardsRepository.addGiftRequestUsers(addUsersData);
        for (const user of updateUsersData) {

            const treeIds = giftCards.filter(item => item.tree_id && item.gift_request_user_id === user.id).map(item => item.tree_id);
            await TreeRepository.updateTrees({
                assigned_to: user.assignee,
                assigned_at: giftCardRequest.gifted_on,
                gifted_to: giftCardRequest.request_type === 'Normal Assignment' ? null : user.recipient,
                user_tree_image: user.profile_image_url,
                updated_at: new Date()
            }, { id: { [Op.in]: treeIds } });

            await GiftCardsRepository.updateGiftRequestUsers(user, { id: user.id });
        }

        // add recipients to Giftee group
        let recipientIds: number[] = []
        addUsersData.forEach(item => { if (item.recipient) recipientIds.push(item.recipient) });
        updateUsersData.forEach(item => { if (item.recipient) recipientIds.push(item.recipient) });
        await UserGroupRepository.addUsersToGifteeGroup(recipientIds);

        // validation on user details
        if (giftCardRequest.no_of_cards !== count && !giftCardRequest.validation_errors?.includes('MISSING_USER_DETAILS')) {
            giftCardRequest.validation_errors = giftCardRequest.validation_errors ? [...giftCardRequest.validation_errors, 'MISSING_USER_DETAILS'] : ['MISSING_USER_DETAILS']
        } else if (giftCardRequest.no_of_cards === count && giftCardRequest.validation_errors?.includes('MISSING_USER_DETAILS')) {
            giftCardRequest.validation_errors = giftCardRequest.validation_errors ? giftCardRequest.validation_errors.filter(error => error !== 'MISSING_USER_DETAILS') : null;
        }

        if (!giftCardRequest.validation_errors || giftCardRequest.validation_errors.length === 0) giftCardRequest.validation_errors = null;
        giftCardRequest.updated_at = new Date();
        const updated = await GiftCardsRepository.updateGiftCardRequest(giftCardRequest);

        res.status(status.success).send(updated);

    } catch (error: any) {
        console.log("[ERROR]", "GiftCardController::upsertGiftRequestUsers", error);
        res.status(status.error).json({
            message: 'Something went wrong. Please try again later.'
        })
    }
}

export const createGiftCards = async (req: Request, res: Response) => {
    const { users, gift_card_request_id: giftCardRequestId } = req.body;

    if (!giftCardRequestId || !users || users.length === 0) {
        res.status(status.bad).json({
            message: 'Please provide valid input details!'
        })
    }

    try {

        const resp = await GiftCardsRepository.getGiftCardRequests(0, 1, [{ columnField: 'id', value: giftCardRequestId, operatorValue: 'equals' }])
        const giftCardRequest: GiftCardRequestAttributes = resp.results[0];

        const usersData: { giftedTo: number, assignedTo: number, imageName?: string, count: number }[] = []
        let count = 0;
        for (const user of users) {

            // gifted To
            const giftedToUser = {
                id: user.gifted_to,
                name: user.gifted_to_name,
                email: user.gifted_to_email,
                phone: user.gifted_to_phone,
                birth_Date: user.gifted_to_dob,
            }
            const giftedTo = await UserRepository.upsertUser(giftedToUser);

            // assigned To
            const assignedToUser = {
                id: user.assigned_to,
                name: user.assigned_to_name,
                email: user.assigned_to_email,
                phone: user.assigned_to_phone,
                birth_Date: user.assigned_to_dob,
            }
            const assignedTo = await UserRepository.upsertUser(assignedToUser);

            if (giftedTo.id !== assignedTo.id && user.relation?.trim()) {
                await UserRelationRepository.createUserRelation({
                    primary_user: giftedTo.id,
                    secondary_user: assignedTo.id,
                    relation: user.relation.trim(),
                    created_at: new Date(),
                    updated_at: new Date(),
                })
            }


            usersData.push({
                giftedTo: giftedTo.id,
                assignedTo: assignedTo.id,
                imageName: user.image_name ? user.image_name : undefined,
                count: parseInt(user.count) || 1,
            });

            count += parseInt(user.count) || 1;
        }

        if (count > giftCardRequest.no_of_cards) {
            res.status(status.bad).json({
                status: status.bad,
                message: "Requested number of gift trees doesn't match in user details!"
            })
            return;
        }

        const cards = await GiftCardsRepository.getBookedTrees(giftCardRequestId, 0, -1);
        cards.results = cards.results.sort((a: any, b: any) => {
            if (a.assigned && !b.assigned) return -1;
            if (!a.assigned && b.assigned) return 1;

            return 0;
        });
        const idsToKeep: number[] = [];
        for (const user of usersData) {
            let count = user.count;
            for (const card of cards.results) {
                if (card.gifted_to === user.giftedTo && card.assigned_to === user.assignedTo) {
                    count--;
                    idsToKeep.push(card.id);
                    if (count === 0) break;
                }
            }
        }

        const extraCards = cards.results.filter(card => !idsToKeep.includes(card.id));
        const deleteIds: number[] = [];
        const resetIds: number[] = [];

        let assignedFound = false;
        for (const card of extraCards) {
            if (!card.gifted_to || card.tree_id) resetIds.push(card.id);
            else deleteIds.push(card.id);

            if ((card as any).assigned) assignedFound = true;
        }

        if (assignedFound) {
            res.status(status.bad).json({
                status: status.bad,
                message: "Some trees are assigned to user. Please unassign before deleting!"
            })
        };
        if (resetIds.length > 0) await GiftCardsRepository.updateGiftCards({ gifted_to: null, assigned_to: null, profile_image_url: null }, { id: { [Op.in]: resetIds } });
        if (deleteIds.length > 0) await GiftCardsRepository.deleteGiftCards({ id: { [Op.in]: deleteIds } });

        await GiftCardsRepository.upsertGiftCards(giftCardRequestId, usersData);

        // validation on user details
        if (giftCardRequest.no_of_cards !== count && !giftCardRequest.validation_errors?.includes('MISSING_USER_DETAILS')) {
            giftCardRequest.validation_errors = giftCardRequest.validation_errors ? [...giftCardRequest.validation_errors, 'MISSING_USER_DETAILS'] : ['MISSING_USER_DETAILS']
        } else if (giftCardRequest.no_of_cards === count && giftCardRequest.validation_errors?.includes('MISSING_USER_DETAILS')) {
            giftCardRequest.validation_errors = giftCardRequest.validation_errors ? giftCardRequest.validation_errors.filter(error => error !== 'MISSING_USER_DETAILS') : null;
        }

        if (!giftCardRequest.validation_errors || giftCardRequest.validation_errors.length === 0) giftCardRequest.validation_errors = null;
        giftCardRequest.updated_at = new Date();
        const updated = await GiftCardsRepository.updateGiftCardRequest(giftCardRequest);

        res.status(status.success).send(updated);
    } catch (error: any) {
        console.log("[ERROR]", "GiftCardController::createGiftCards", error);
        res.status(status.error).json({
            message: 'Something went wrong. Please try again later.'
        })
    }
}

export const updateGiftCardUserDetails = async (req: Request, res: Response) => {
    const users: any[] = req.body.users;
    let failureCount = 0;

    if (!users || users.length === 0) {
        res.status(status.bad).send({
            status: status.bad,
            message: "Invalid request!"
        })
        return;
    }

    try {
        const resp = await GiftCardsRepository.getBookedTrees(users[0].gift_request_id, 0, -1);
        const giftCards = resp.results;
        for (const user of users) {

            try {
                const updateRequest: any = {
                    id: user.recipient,
                    name: user.recipient_name,
                    email: user.recipient_email,
                    phone: user.recipient_phone,
                }
                await UserRepository.updateUser(updateRequest);

                if (user.assignee !== user.recipient) {
                    const updateRequest: any = {
                        id: user.assignee,
                        name: user.assignee_name,
                        email: user.assignee_email,
                        phone: user.assignee_phone,
                    }
                    await UserRepository.updateUser(updateRequest);

                    if (user.relation?.trim()) {
                        await UserRelationRepository.createUserRelation({
                            primary_user: user.recipient,
                            secondary_user: user.assignee,
                            relation: user.relation.trim(),
                            created_at: new Date(),
                            updated_at: new Date(),
                        })
                    }
                }

                const updateFields = {
                    ...user,
                    profile_image_url: user.profile_image_url || null,
                    updated_at: new Date(),
                }
                await GiftCardsRepository.updateGiftRequestUsers(updateFields, { id: user.id });

                const treeIds = giftCards
                    .filter(card => card.gift_request_user_id === user.id)
                    .map(card => card.tree_id);

                const updateTree = {
                    user_tree_image: user.profile_image_url || null,
                    updated_at: new Date()
                }
                if (treeIds.length > 0) await TreeRepository.updateTrees(updateTree, { id: { [Op.in]: treeIds }, assigned_to: user.assignee });

            } catch (error: any) {
                console.log("[ERROR]", "GiftCardController::updateGiftCardUserDetails", user, error);
                failureCount++;
            }
        }

        if (failureCount !== 0) {
            res.status(status.error).send({
                code: status.error,
                message: `Failed to update ${failureCount} users!`
            })
        } else {
            res.status(status.success).send();
        }
    } catch (error: any) {
        console.log("[ERROR]", "GiftCardController::updateGiftCardUserDetails", error);
        res.status(status.error).json({
            message: 'Something went wrong. Please try again later.'
        })
    }

}

export const createGiftCardPlots = async (req: Request, res: Response) => {
    const { plot_ids: plotIds, gift_card_request_id: giftCardRequestId } = req.body;

    if (!giftCardRequestId || !plotIds || plotIds.length === 0) {
        res.status(status.bad).json({
            message: 'Please provide valid input details!'
        })
    }

    try {
        await GiftCardsRepository.addGiftCardPlots(giftCardRequestId, plotIds);
        res.status(status.success).send();
    } catch (error: any) {
        console.log("[ERROR]", "GiftCardController::createGiftCardPlots", error);
        res.status(status.error).json({
            message: 'Something went wrong. Please try again later.'
        })
    }
}

export const bookTreesForGiftRequest = async (req: Request, res: Response) => {
    const { gift_card_request_id: giftCardRequestId, gift_card_trees: trees, diversify, book_non_giftable, book_all_habits } = req.body;
    if (!giftCardRequestId) {
        res.status(status.bad).json({
            message: 'Please provide valid input details!'
        })
    }

    try {

        const resp = await GiftCardsRepository.getGiftCardRequests(0, 1, [{ columnField: 'id', operatorValue: 'equals', value: giftCardRequestId }]);
        const giftCardRequest = resp.results[0];

        const giftCardPlotMapping = await GiftCardsRepository.getGiftCardPlots(giftCardRequestId);
        const plotIds = giftCardPlotMapping.map(plot => plot.plot_id);
        if (plotIds.length === 0) {
            res.status(status.bad).json({
                message: 'Please assign plot to this request first!'
            })
            return;
        }

        let treeIds: number[] = [];
        const treesCount = giftCardRequest.no_of_cards - Number((giftCardRequest as any).booked);
        if (!trees || trees.length === 0) {
            treeIds = await TreeRepository.mapTreesInPlotToUserAndGroup(giftCardRequest.user_id, giftCardRequest.group_id, plotIds, treesCount, book_non_giftable, diversify, book_all_habits);
            if (treeIds.length === 0) {
                res.status(status.bad).json({
                    message: 'Enough trees not available for this request!'
                })
                return;
            }
        } else {
            treeIds = trees.map((item: any) => item.tree_id);
            const giftCards = await GiftCardsRepository.getGiftCards(0, -1, { tree_id: { [Op.in]: treeIds } });
            if (giftCards.results.some(card => card.gift_card_request_id !== giftCardRequestId)) {
                res.status(status.bad).json({
                    message: 'Some trees are already assigned to other gift card request!'
                })
                return;
            }
            await TreeRepository.mapTreesToUserAndGroup(giftCardRequest.user_id, giftCardRequest.group_id, treeIds)
        }

        // add user to donations group
        if (treeIds.length > 0) await UserGroupRepository.addUserToDonorGroup(giftCardRequest.user_id);
        await GiftCardsRepository.bookGiftCards(giftCardRequestId, treeIds);

        const cards = await GiftCardsRepository.getBookedTrees(giftCardRequestId, 0, -1);
        const finalTreeIds = cards.results.filter(card => card.tree_id).map(card => card.tree_id);

        if (finalTreeIds.length === giftCardRequest.no_of_cards) {
            giftCardRequest.status = GiftCardRequestStatus.pendingAssignment;
        }

        giftCardRequest.is_active = true;
        giftCardRequest.updated_at = new Date();
        await GiftCardsRepository.updateGiftCardRequest(giftCardRequest);

        res.status(status.success).send();

    } catch (error: any) {
        console.log("[ERROR]", "GiftCardController::bookTreesForGiftRequest", error);
        res.status(status.error).json({
            message: 'Something went wrong. Please try again later.'
        })
    }
}

export const bookGiftCardTrees = async (req: Request, res: Response) => {
    const { gift_card_request_id: giftCardRequestId, gift_card_trees: giftCardTrees, diversify, book_non_giftable } = req.body;
    if (!giftCardRequestId) {
        res.status(status.bad).json({
            message: 'Please provide valid input details!'
        })
    }

    try {
        const resp = await GiftCardsRepository.getGiftCardRequests(0, 1, [{ columnField: 'id', operatorValue: 'equals', value: giftCardRequestId }]);
        const giftCardRequest = resp.results[0];

        const giftCardPlotMapping = await GiftCardsRepository.getGiftCardPlots(giftCardRequestId);
        const plotIds = giftCardPlotMapping.map(plot => plot.plot_id);
        if (plotIds.length === 0) {
            res.status(status.bad).json({
                message: 'Please assign plot to this request first!'
            })
            return;
        }

        let addUserToDonorGroup = false;
        if (giftCardTrees && giftCardTrees.length) {
            const treeIds: number[] = giftCardTrees.map((item: any) => item.tree_id);
            await TreeRepository.mapTreesToUserAndGroup(giftCardRequest.user_id, giftCardRequest.group_id, treeIds)

            const bookTreeIds: number[] = []
            for (const item of giftCardTrees) {
                if (item.id) {
                    await GiftCardsRepository.updateGiftCards({ tree_id: item.tree_id, updated_at: new Date() }, { id: item.id });
                } else {
                    bookTreeIds.push(item.tree_id);
                }
            }

            if (bookTreeIds.length > 0) {
                await GiftCardsRepository.bookGiftCards(giftCardRequestId, bookTreeIds);
                addUserToDonorGroup = true;
            }
        } else {
            const treeIds = await TreeRepository.mapTreesInPlotToUserAndGroup(giftCardRequest.user_id, giftCardRequest.group_id, plotIds, giftCardRequest.no_of_cards, book_non_giftable, diversify);
            if (treeIds.length === 0) {
                res.status(status.bad).json({
                    message: 'Enough trees not available for this request!'
                })
                return;
            }
            await GiftCardsRepository.bookGiftCards(giftCardRequestId, treeIds);
            addUserToDonorGroup = true;
        }

        // add user to donations group
        if (addUserToDonorGroup) await UserGroupRepository.addUserToDonorGroup(giftCardRequest.user_id);

        const cards = await GiftCardsRepository.getBookedTrees(giftCardRequestId, 0, -1);
        const treeIds = cards.results.filter(card => card.tree_id).map(card => card.tree_id);

        if (treeIds.length === giftCardRequest.no_of_cards) {
            giftCardRequest.status = GiftCardRequestStatus.pendingAssignment;
        }

        giftCardRequest.is_active = true;
        giftCardRequest.updated_at = new Date();
        await GiftCardsRepository.updateGiftCardRequest(giftCardRequest);

        res.status(status.success).send();
    } catch (error: any) {
        console.log("[ERROR]", "GiftCardController::bookGiftCardTrees", error);
        res.status(status.error).json({
            message: 'Something went wrong. Please try again later.'
        })
    }
}

export const getBookedTrees = async (req: Request, res: Response) => {
    const { offset, limit } = getOffsetAndLimitFromRequest(req);
    const { gift_card_request_id: giftCardRequestId } = req.params;
    if (!giftCardRequestId || isNaN(parseInt(giftCardRequestId))) {
        res.status(status.bad).json({
            message: 'Please provide valid input details!'
        })
    }

    try {
        const resp = await GiftCardsRepository.getBookedTrees(parseInt(giftCardRequestId), offset, limit);
        res.status(status.success).json(resp);
    } catch (error: any) {
        console.log("[ERROR]", "GiftCardController::getBookedTrees", error);
        res.status(status.error).json({
            message: 'Something went wrong. Please try again later.'
        })
    }
}

export const unBookTrees = async (req: Request, res: Response) => {
    const { gift_card_request_id: giftCardRequestId, tree_ids, unmap_all: unmapAll } = req.body;
    if (!giftCardRequestId) {
        res.status(status.bad).json({
            message: 'Please provide valid input details!'
        })
    }

    try {

        let treeIds: number[] = tree_ids ? tree_ids : [];
        if (unmapAll) {
            const bookedTreesResp = await GiftCardsRepository.getBookedTrees(giftCardRequestId, 0, -1);
            treeIds = bookedTreesResp.results.filter(card => card.tree_id).map(card => card.tree_id);
        }

        if (treeIds.length > 0) {
            const updateConfig = {
                mapped_to_user: null,
                mapped_to_group: null,
                mapped_at: null,
                sponsored_by_user: null,
                sponsored_by_group: null,
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
                updated_at: new Date(),
            }

            await TreeRepository.updateTrees(updateConfig, { id: { [Op.in]: treeIds } });
            await GiftCardsRepository.deleteGiftCards({ gift_card_request_id: giftCardRequestId, tree_id: { [Op.in]: treeIds } });
        }

        // delete gift request plots
        await GiftCardsRepository.deleteGiftCardRequestPlots({ gift_card_request_id: giftCardRequestId })

        res.status(status.success).send();
    } catch (error: any) {
        console.log("[ERROR]", "GiftCardController::unBookTrees", error);
        res.status(status.error).json({
            message: 'Something went wrong. Please try again later.'
        })
    }
}

const assignTrees = async (giftCardRequest: GiftCardRequestAttributes, trees: GiftCard[], users: GiftRequestUser[], cards: GiftCard[], memoryImageUrls: string[] | null) => {
    const existingTreesMap: Record<number, GiftCard> = {};
    for (const tree of cards) {
        existingTreesMap[tree.id] = tree;
    }

    const normalAssignment = giftCardRequest.request_type === 'Normal Assignment'
    for (const tree of trees) {
        const data = {
            ...tree,
            updated_at: new Date(),
        }
        await GiftCardsRepository.updateGiftCard(data);

        const existingTree = existingTreesMap[tree.id];
        if (data.gift_request_user_id) {
            const user = users.find(user => user.id === tree.gift_request_user_id);
            if (user) {
                const updateRequest = {
                    assigned_at: normalAssignment ? new Date() : giftCardRequest.gifted_on,
                    assigned_to: user.assignee,
                    gifted_to: normalAssignment ? null : user.recipient,
                    updated_at: new Date(),
                    description: giftCardRequest.event_name,
                    event_type: giftCardRequest.event_type,
                    planted_by: null,
                    gifted_by: normalAssignment ? null : giftCardRequest.user_id,
                    gifted_by_name: normalAssignment ? null : giftCardRequest.planted_by,
                    user_tree_image: user.profile_image_url,
                    memory_images: memoryImageUrls,
                }

                await TreeRepository.updateTrees(updateRequest, { id: tree.tree_id });
            }
        } else if (existingTree.tree_id) {
            const updateRequest = {
                assigned_at: null,
                assigned_to: null,
                gifted_to: null,
                gifted_by: null,
                updated_at: new Date(),
                description: null,
                event_type: null,
                planted_by: null,
                gifted_by_name: null,
                user_tree_image: null,
                memory_images: null,
            }
            await TreeRepository.updateTrees(updateRequest, { id: existingTree.tree_id });
        }
    }
}

export const assignGiftRequestTrees = async (req: Request, res: Response) => {
    const { gift_card_request_id: giftCardRequestId, trees, auto_assign } = req.body;

    try {

        const resp = await GiftCardsRepository.getGiftCardRequests(0, 1, [{ columnField: 'id', operatorValue: 'equals', value: giftCardRequestId }]);
        if (resp.results.length === 0) {
            res.status(status.bad).json({
                message: 'Please provide valid input details!'
            })
            return;
        }
        const giftCardRequest = resp.results[0];

        let memoryImageUrls: string[] | null = null;
        if (giftCardRequest.album_id) {
            const albums = await AlbumRepository.getAlbums({ id: giftCardRequest.album_id });
            if (albums.length === 1) memoryImageUrls = albums[0].images;
        }

        const users = await GiftCardsRepository.getGiftRequestUsers(giftCardRequestId);
        const existingTreesResp = await GiftCardsRepository.getBookedTrees(giftCardRequestId, 0, -1);

        if (auto_assign) {
            await autoAssignTrees(giftCardRequest, users, existingTreesResp.results, memoryImageUrls);
        } else {
            await assignTrees(giftCardRequest, trees, users, existingTreesResp.results, memoryImageUrls);
        }

        const updatedResp = await GiftCardsRepository.getGiftCardRequests(0, 1, [{ columnField: 'id', operatorValue: 'equals', value: giftCardRequestId }]);
        const giftRequest: any = updatedResp.results[0];

        if (giftRequest.no_of_cards == Number(giftRequest.assigned)) {
            giftRequest.status = GiftCardRequestStatus.completed;
            giftRequest.updated_at = new Date();
            await GiftCardsRepository.updateGiftCardRequest(giftRequest);
        }

        res.status(status.success).json();
    } catch (error: any) {
        console.log("[ERROR]", "GiftCardController::assignGiftRequestTrees", error);
        res.status(status.error).json({
            message: 'Something went wrong. Please try again later.'
        })
    }
}


export const generateGiftCardTemplatesForGiftCardRequest = async (req: Request, res: Response) => {
    const { gift_card_request_id: giftCardRequestId } = req.params;

    try {
        const resp = await GiftCardsRepository.getGiftCardRequests(0, 1, [{ columnField: 'id', operatorValue: 'equals', value: parseInt(giftCardRequestId) }]);
        if (resp.results.length === 0) {
            res.status(status.bad).json({
                message: 'Please provide valid input details!'
            })
            return;
        }

        const giftCardRequest = resp.results[0];
        if (!process.env.GIFT_CARD_PRESENTATION_ID) {
            console.log('[ERROR]', 'GiftCardController::getGiftCardTemplatesForGiftCardRequest', 'Missing gift card template presentation id in ENV variables.')
            res.status(status.error).json({
                message: 'Something went wrong. Please try again later!'
            })
            return;
        }
        const templatePresentationId: string = process.env.GIFT_CARD_PRESENTATION_ID;

        // send the response - because generating cards may take a while. users can download card later
        res.status(status.success).send();

        await generateGiftCardsForGiftRequest(giftCardRequest);

    } catch (error: any) {
        console.log("[ERROR]", "GiftCardController::getGiftCardTemplatesForGiftCardRequest", error);
    }
}

export const downloadGiftCardTemplatesForGiftCardRequest = async (req: Request, res: Response) => {
    const { gift_card_request_id: giftCardRequestId } = req.params;
    const { downloadType } = req.query;

    let mimeType: string;
    switch (downloadType) {
        case 'pdf':
            mimeType = 'application/pdf';
            break;
        case 'ppt':
            mimeType = 'application/vnd.openxmlformats-officedocument.presentationml.presentation';
            break;
        case 'zip':
            mimeType = 'application/zip'
            break;
        default:
            return res.status(status.bad).json({ message: 'Unsupported format. Use "zip", "pdf" or "ppt".' });
    }

    try {

        const resp = await GiftCardsRepository.getGiftCardRequests(0, 1, [{ columnField: 'id', operatorValue: 'equals', value: parseInt(giftCardRequestId) }]);
        if (resp.results.length === 0) {
            res.status(status.bad).json({
                message: 'Please provide valid input details!'
            })
            return;
        }

        const giftCardRequest = resp.results[0];
        if (!giftCardRequest.presentation_id) {
            res.status(status.error).json({
                message: 'Gift cards not generated yet!'
            })
            return;
        }

        if (downloadType !== 'zip') {
            res.setHeader('Content-Type', mimeType);
            res.setHeader('Content-Disposition', `attachment; filename="slide.${downloadType}"`);
            const fileData = await downloadSlide(giftCardRequest.presentation_id, mimeType);

            fileData.pipe(res);

            // Handle errors during streaming
            fileData.on('error', (error) => {
                console.error('Error streaming the file:', error);
                res.status(500).send('Error streaming the file');
            });
        } else {
            res.setHeader('Content-Disposition', `attachment; filename=${(giftCardRequest as any).user_name + '_' + giftCardRequest.no_of_cards}.zip`);
            res.setHeader('Content-Type', 'application/zip');
            const archive = archiver('zip', {
                zlib: { level: 9 },
            });

            archive.pipe(res);

            const giftCards = await GiftCardsRepository.getBookedTrees(giftCardRequest.id, 0, -1);
            for (const giftCard of giftCards.results) {
                if (!giftCard.card_image_url) continue;

                try {
                    const response = await axios({
                        url: giftCard.card_image_url,
                        method: 'GET',
                        responseType: 'stream',
                    });

                    archive.append(response.data, { name: `${(giftCard as any).user_name}_${(giftCard as any).sapling_id}.jpg` });
                } catch (error: any) {
                    console.error(`Failed to download image from templateImage:`, error.message);
                }
            }
            await archive.finalize();
            res.status(status.success).send();
        }
    } catch (error: any) {
        console.log("[ERROR]", "GiftCardController::getGiftCardTemplatesForGiftCardRequest", error);
        res.status(status.error).json({
            message: 'Something went wrong. Please try again later.'
        })
    }
}

export const generateGiftCardSlide = async (req: Request, res: Response) => {
    const {
        sapling_id: saplingId,
        plant_type: plantType,
        user_name: userName,
        primary_message: primaryMessage,
        secondary_message: secondaryMessage,
        logo,
        logo_message: logoMessage
    } = req.body;

    const record = {
        name: userName ? userName : "<User's Name>",
        sapling: saplingId ? saplingId : '00000',
        content1: primaryMessage,
        content2: secondaryMessage,
        logo: logo,
        logo_message: logoMessage
    }

    try {
        const { slideId, pId } = await generateGiftCardTemplate(record, plantType, true)

        res.status(status.success).send({
            presentation_id: pId,
            slide_id: slideId
        })
    } catch (error: any) {
        console.log("[ERROR]", "GiftCardController::generateGiftCardSlide", error);
        res.status(status.error).json({
            message: 'Something went wrong. Please try again later.'
        })
    }
}

export const updateGiftCardTemplate = async (req: Request, res: Response) => {

    const {
        user_name: userName,
        sapling_id: saplingId,
        slide_id: slideId,
        primary_message: primaryMessage,
        secondary_message: secondaryMessage,
        logo,
        logo_message: logoMessage
    } = req.body;

    const record = {
        name: userName ? userName : "<User's Name>",
        sapling: saplingId ? saplingId : '00000',
        content1: primaryMessage,
        content2: secondaryMessage,
        logo: logo,
        logo_message: logoMessage
    }

    if (!process.env.LIVE_GIFT_CARD_PRESENTATION_ID) {
        console.log('[ERROR]', 'GiftCardController::getGiftCardTemplatesForGiftCardRequest', 'Missing live gift card template presentation id in ENV variables.')
        res.status(status.error).json({
            message: 'Something went wrong. Please try again later!'
        })

        return;
    }

    try {

        const presentationId = process.env.LIVE_GIFT_CARD_PRESENTATION_ID;

        if (presentationId && slideId) {
            await updateSlide(presentationId, slideId, record, true)
            res.status(status.success).send();
        } else {
            res.status(status.bad).json({
                status: status.bad,
                message: 'Please provide valid input details!'
            })
        }
    } catch (error: any) {
        console.log("[ERROR]", "GiftCardController::generateGiftCardSlide", error);
        res.status(status.error).json({
            message: 'Something went wrong. Please try again later.'
        })
    }
}


export const redeemGiftCard = async (req: Request, res: Response) => {
    const {
        gift_card_id: giftCardId,
        event_type: eventType,
        event_name: eventName,
        gifted_on: giftedOn,
        gifted_by: giftedBy,
        user,
        tree_id: treeId,
        profile_image_url: profileImageUrl
    } = req.body;

    if (!giftCardId || (!user?.id && (!user?.name || !user?.email))) {
        res.status(status.bad).json({
            message: 'Please provide valid input details!'
        })
        return;
    }

    try {

        let userId = user?.id;
        if (!userId) {
            const usr = await UserRepository.upsertUser(user);
            userId = usr.id;
        }

        const giftCard = await GiftCardsRepository.getGiftCard(giftCardId);
        if (!giftCard) {
            res.status(status.bad).json({
                message: 'Gift card not found!'
            })
            return;
        }

        let giftRequestUser: GiftRequestUser | null = null;
        const giftCardUsers = await GiftCardsRepository.getGiftRequestUsersByQuery({ gift_request_id: giftCard.gift_card_request_id, assignee: userId });
        if (giftCardUsers.length > 0) {
            giftRequestUser = giftCardUsers[0];
        } else {
            const resp = await GiftCardsRepository.addGiftRequestUsers([{ gift_request_id: giftCard.gift_card_request_id, gifted_trees: 1, assignee: userId, recipient: userId, profile_image_url: profileImageUrl, created_at: new Date(), updated_at: new Date() }], true);
            if (resp && resp.length === 1) giftRequestUser = resp[0];
        }

        const resp = await GiftCardsRepository.getGiftCardRequests(0, 1, [{ columnField: 'id', operatorValue: 'equals', value: giftCard.gift_card_request_id }])
        const giftCardRequest = resp.results[0];

        let memoryImageUrls: string[] | null = null;
        if (giftCardRequest.album_id) {
            const albums = await AlbumRepository.getAlbums({ id: giftCardRequest.album_id });
            if (albums.length === 1) memoryImageUrls = albums[0].images;
        }

        const treeUpdateRequest = {
            assigned_at: giftedOn ? giftedOn : giftCardRequest.gifted_on,
            assigned_to: userId,
            gifted_to: userId,
            event_type: eventType?.trim() ? eventType.trim() : giftCardRequest.event_type,
            description: eventName?.trim() ? eventName.trim() : giftCardRequest.event_name,
            gifted_by_name: giftedBy?.trim() ? giftedBy.trim() : giftCardRequest.planted_by,
            updated_at: new Date(),
            planted_by: null,
            gifted_by: giftCardRequest.user_id,
            memory_images: memoryImageUrls,
            user_tree_image: profileImageUrl,
        }

        const updatedCount = await TreeRepository.updateTrees(treeUpdateRequest, { id: treeId })
        if (!updatedCount) {
            res.status(status.bad).json({
                message: 'Tree not found!'
            })
            return;
        }

        giftCard.assigned_to = userId;
        giftCard.gifted_to = userId;
        giftCard.gift_request_user_id = giftRequestUser ? giftRequestUser.id : null;
        giftCard.updated_at = new Date();
        await giftCard.save();

        res.status(status.success).send();
    } catch (error: any) {
        console.log("[ERROR]", "GiftCardController::updateGiftCard", error);
        res.status(status.bad).send({ message: 'Something went wrong. Please try again later.' });
    }
};

const sendMailsToAssigneeReceivers = async (giftCardRequest: any, giftCards: any[], eventType: string, attachCard: boolean, ccMails?: string[], testMails?: string[]) => {
    let count = 5;
    const userEmailDataMap: Record<number, any> = {};
    for (const giftCard of giftCards) {
        if (!giftCard.assigned_to_email || (giftCard.assigned_to_email as string).trim().endsWith('@14trees')) continue;
        if (giftCard.event_type === '2') continue;  // memorial

        if (giftCard.assignee === giftCard.recipient && giftCard.mail_sent) continue;

        const key = giftCard.assignee;
        const treeData = {
            sapling_id: giftCard.sapling_id,
            dashboard_link: 'https://dashboard.14trees.org/profile/' + giftCard.sapling_id,
            planted_via: giftCard.planted_via,
            plant_type: giftCard.plant_type,
            scientific_name: giftCard.scientific_name,
            card_image_url: giftCard.card_image_url,
            event_name: giftCard.event_name,
            assigned_to_name: giftCard.assigned_to_name,
        };

        if (userEmailDataMap[key]) {
            userEmailDataMap[key].trees.push(treeData);
            userEmailDataMap[key].count++;
        } else {
            userEmailDataMap[key] = {
                trees: [treeData],
                assigned_to_name: giftCard.assigned_to_name,
                user_email: giftCard.assigned_to_email,
                user_name: giftCard.assigned_to_name,
                event_name: giftCard.event_name,
                group_name: giftCardRequest.group_name,
                company_logo_url: giftCardRequest.logo_url,
                assigned_to: giftCard.assignee,
                gifted_to: giftCard.recipient,
                self: true,
                is_gift: giftCardRequest.request_type === 'Cards Request',
                count: 1
            }
        }
    }

    const ccMailIds = (ccMails && ccMails.length !== 0) ? ccMails : undefined;
    const isTestMail = (testMails && testMails.length !== 0) ? true : false

    for (const emailData of Object.values(userEmailDataMap)) {
        const mailIds = (testMails && testMails.length !== 0) ? testMails : [emailData.user_email];

        let attachments: { filename: string; path: string }[] | undefined = undefined;
        if (attachCard) {
            const files: { filename: string; path: string }[] = []
            for (const tree of emailData.trees) {
                if (tree.card_image_url) {
                    files.push({
                        filename: tree.assigned_to_name + "_" + tree.card_image_url.split("/").slice(-1)[0],
                        path: tree.card_image_url
                    })
                }
            }

            if (files.length > 0) attachments = files;
        }

        const templatesMap: Record<string, string> = {}
        const templateType: TemplateType = emailData.count > 1 ? 'receiver-multi-trees' : 'receiver-single-tree';
        if (!templatesMap[templateType]) {
            const templates = await EmailTemplateRepository.getEmailTemplates({ event_type: eventType, template_type: templateType })
            if (templates.length === 0) {
                console.log("[ERROR]", "giftCardsController::sendEmailForGiftCardRequest", "Email template not found");
                continue;
            }
            templatesMap[templateType] = templates[0].template_name
        }

        let subject: string | undefined = undefined;
        if (eventType === 'birthday') {
            subject = `Birthday wishes from ${giftCardRequest.planted_by ? giftCardRequest.planted_by : giftCardRequest.group_name ? giftCardRequest.group_name : giftCardRequest.user_name.split(" ")[0]} and 14 Trees`;
        }
        await sendDashboardMail(templatesMap[templateType], emailData, mailIds, ccMailIds, attachments, subject);

        count = count - 1;
        if (isTestMail && count === 0) break;
    }
}


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
        res.status(status.bad).json({
            message: 'Please provide valid input details!'
        })
        return;
    }

    try {
        const resp = await GiftCardsRepository.getGiftCardRequests(0, 1, [{ columnField: 'id', operatorValue: 'equals', value: giftCardRequestId }])
        if (resp.results.length !== 1) {
            res.status(status.bad).json({
                message: 'Please provide valid input details!'
            })
            return;
        }

        const giftCardRequest: any = resp.results[0];
        const giftCards: any[] = await GiftCardsRepository.getGiftCardUserAndTreeDetails(parseInt(giftCardRequestId));

        if (emailSponsor) sendMailsToSponsors(giftCardRequest, giftCards, eventType, attach_card, sponsorCC, testMails);
        if (emailReceiver) await sendMailsToReceivers(giftCardRequest, giftCards, eventType, attach_card, receiverCC, testMails);
        if (emailAssignee) await sendMailsToAssigneeReceivers(giftCardRequest, giftCards, eventType, attach_card, receiverCC, testMails);

        res.status(status.success).send();
    } catch (error: any) {
        console.log("[ERROR]", "GiftCardController::sendEmailForGiftCardRequest", error);
        res.status(status.bad).send({ message: 'Something went wrong. Please try again later.' });
    }
}


export const generateFundRequest = async (req: Request, res: Response) => {
    const { gift_card_request_id: giftCardRequestId } = req.params;
    if (!giftCardRequestId || isNaN(parseInt(giftCardRequestId))) {
        res.status(status.bad).json({
            message: 'Please provide valid input details!'
        })
    }

    try {
        const resp = await GiftCardsRepository.getGiftCardRequests(0, 1, [{ columnField: 'id', operatorValue: 'equals', value: giftCardRequestId }])
        if (resp.results.length !== 1) {
            res.status(status.bad).json({
                message: 'Please provide valid input details!'
            })
            return;
        }

        const giftCardRequest = resp.results[0];
        if (!giftCardRequest.group_id) {
            res.status(status.bad).json({
                message: 'Fund request can be generated only for corporate requests!'
            })
            return;
        }
        const group = await GroupRepository.getGroup(giftCardRequest.group_id);
        if (!group) {
            res.status(status.bad).json({
                message: 'Group not found!'
            })
            return;
        }

        const perTreeCost =
            giftCardRequest.request_type === 'Normal Assignment'
                ? giftCardRequest.category === 'Foundation'
                    ? 3000
                    : 1500
                : 2000

        const filename = `${group.name} [Req. No: ${giftCardRequest.id}] ${new Date().toDateString()}.pdf`;
        const totalAmount = giftCardRequest.no_of_cards * (perTreeCost);
        let data: any = {
            address: group.address?.split('\n').join('<br/>'),
            date: moment(new Date()).format('MMMM DD, YYYY'),
            no_of_trees: giftCardRequest.no_of_cards,
            per_tree_cost: perTreeCost,
            total_amount: formatNumber(totalAmount),
            total_amount_words: "Rupees " + numberToWords(totalAmount).split(' ').map((word: string) => word.charAt(0).toUpperCase() + word.slice(1)).join(' ') + " only",
        }

        const base64Data = await generateFundRequestPdf(data);
        const s3Resp = await uploadBase64DataToS3(filename, 'gift_cards', base64Data, { 'Content-Type': 'application/pdf' }, giftCardRequest.request_id);
        res.status(status.success).send({ url: s3Resp.location });
    } catch (error: any) {
        console.log("[ERROR]", "GiftCardController::generateFundRequest", error);
        res.status(status.bad).send({ message: 'Something went wrong. Please try again later.' });
    }
}
