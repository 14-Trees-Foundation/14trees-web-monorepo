import { Request, Response } from "express";
import { status } from "../helpers/status";
import { FilterItem } from "../models/pagination";
import { GiftCardsRepository } from "../repo/giftCardsRepo";
import { getOffsetAndLimitFromRequest } from "./helper/request";
import { UserRepository } from "../repo/userRepo";
import { GiftCardRequestAttributes, GiftCardRequestCreationAttributes, GiftCardRequestStatus, GiftCardRequestValidationError } from "../models/gift_card_request";
import TreeRepository from "../repo/treeRepo";
import { createSlide, deleteUnwantedSlides, getSlideThumbnail, updateSlide } from "./helper/slides";
import { UploadFileToS3, uploadImageUrlToS3 } from "./helper/uploadtos3";
import archiver from 'archiver';
import axios from 'axios'
import { Op } from "sequelize";
import { copyFile, downloadSlide } from "../services/google";
import { sendDashboardMail } from "../services/gmail/gmail";
import { AlbumRepository } from "../repo/albumRepo";
import { UserRelationRepository } from "../repo/userRelationsRepo";
import { EmailTemplateRepository } from "../repo/emailTemplatesRepo";
import { TemplateType } from "../models/email_template";


export const getGiftCardRequests = async (req: Request, res: Response) => {
    const { offset, limit } = getOffsetAndLimitFromRequest(req);
    const filters: FilterItem[] = req.body?.filters;

    const giftCardRequests = await GiftCardsRepository.getGiftCardRequests(offset, limit, filters);
    giftCardRequests.results.forEach((giftCard: any) => {
        giftCard.plot_ids = giftCard.plot_ids.filter((plot_id: any) => plot_id !== null);
    })
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
        planted_by: plantedBy,
        logo_message: logoMessage,
        request_id: requestId,
        notes: notes,
        payment_id: paymentId,
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
        payment_id: paymentId || null
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
        const giftCardsResp = await GiftCardsRepository.getBookedCards(giftRequestId, offset, limit);
        const treeIds = giftCardsResp.results.map(item => item.tree_id).filter(id => id ? true : false);

        // update booked or assigned trees
        if (treeIds.length > 0) await TreeRepository.updateTrees(updateFields, { id: { [Op.in]: treeIds } })

        offset += limit;
        if (offset >= Number(giftCardsResp.total)) break;
    }
}

export const updateGiftCardRequest = async (req: Request, res: Response) => {

    const giftCardRequest: GiftCardRequestAttributes = req.body;
    if (!req.body.validation_errors) giftCardRequest.validation_errors = [];
    else giftCardRequest.validation_errors = req.body.validation_errors?.split(',') ?? null

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

        const updatedGiftCardRequest = await GiftCardsRepository.updateGiftCardRequest(giftCardRequest);
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

        if ((updatedGiftCardRequest.status === GiftCardRequestStatus.pendingGiftCards || updatedGiftCardRequest.status === GiftCardRequestStatus.completed) && Object.keys(treeUpdateRequest).length !== 0) {
            await updateTreesForGiftRequest(giftCardRequest.id, treeUpdateRequest);
        }

        res.status(status.success).json(updatedGiftCardRequest);
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
        const cardsResp = await GiftCardsRepository.getBookedCards(giftCardRequestId, 0, -1);

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
    if (!giftCardRequestId || !albumId) {
        res.status(status.bad).send({ message: "Invalid input!" });
        return;
    }

    try {

        const albums = await AlbumRepository.getAlbums({ id: albumId });
        if (albums.length === 1) {

            const giftCardRequestResp = await GiftCardsRepository.getGiftCardRequests(0, 1, [{ columnField: 'id', operatorValue: 'equals', value: giftCardRequestId }]);
            if (giftCardRequestResp.results.length === 1) {
                const giftCardRequest = giftCardRequestResp.results[0];
                giftCardRequest.album_id = albums[0].id;
                giftCardRequest.updated_at = new Date();
                await GiftCardsRepository.updateGiftCardRequest(giftCardRequest);

                const updateMemoryImages = {
                    memory_images: albums[0].images,
                    updated_at: new Date(),
                }

                await updateTreesForGiftRequest(giftCardRequest.id, updateMemoryImages);
            }
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

    const cardsResp = await GiftCardsRepository.getBookedCards(giftCardRequestId, 0, -1);

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

        await GiftCardsRepository.upsertGiftCards(giftCardRequestId, usersData);

        // validation on user details
        if (giftCardRequest.no_of_cards !== count && !giftCardRequest.validation_errors?.includes('MISSING_USER_DETAILS')) {
            giftCardRequest.validation_errors = giftCardRequest.validation_errors ? [...giftCardRequest.validation_errors, 'MISSING_USER_DETAILS'] : ['MISSING_USER_DETAILS']
        } else if (giftCardRequest.no_of_cards === count && giftCardRequest.validation_errors?.includes('MISSING_USER_DETAILS')) {
            giftCardRequest.validation_errors = giftCardRequest.validation_errors ? giftCardRequest.validation_errors.filter(error => error !== 'MISSING_USER_DETAILS') : null;
        }

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
    const { users } = req.body;
    let failureCount = 0;

    if (!users || users.length === 0) {
        res.status(status.bad).send({
            status: status.bad,
            message: "Invalid request!"
        })
        return;
    }

    try {
        const resp = await GiftCardsRepository.getBookedCards(users[0].gift_card_request_id, 0, -1);
        const giftCards = resp.results;

        for (const user of users) {

            try {
                const updateRequest: any = {
                    id: user.assigned_to,
                    name: user.assigned_to_name,
                    email: user.assigned_to_email,
                    phone: user.assigned_to_phone,
                }
                await UserRepository.updateUser(updateRequest);

                const updateGiftCard = {
                    profile_image_url: user.profile_image_url || null,
                    updated_at: new Date()
                }
                await GiftCardsRepository.updateGiftCards(updateGiftCard, { assigned_to: user.assigned_to, gifted_to: user.gifted_to, gift_card_request_id: user.gift_card_request_id });

                const treeIds = giftCards
                    .filter(card => card.gifted_to === user.gifted_to && card.assigned_to === user.assigned_to && card.tree_id)
                    .map(card => card.tree_id);

                const updateTree = {
                    user_tree_image: user.profile_image_url || null,
                    updated_at: new Date()
                }
                if (treeIds.length > 0) await TreeRepository.updateTrees(updateTree, { id: { [Op.in]: treeIds }, assigned_to: user.assigned_to })

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

            if (bookTreeIds.length > 0) await GiftCardsRepository.bookGiftCards(giftCardRequestId, bookTreeIds);
        } else {
            const treeIds = await TreeRepository.mapTreesInPlotToUserAndGroup(giftCardRequest.user_id, giftCardRequest.group_id, plotIds, giftCardRequest.no_of_cards, book_non_giftable, diversify);
            if (treeIds.length === 0) {
                res.status(status.bad).json({
                    message: 'Enough trees not available for this request!'
                })
                return;
            }
            await GiftCardsRepository.bookGiftCards(giftCardRequestId, treeIds);
        }

        const cards = await GiftCardsRepository.getBookedCards(giftCardRequestId, 0, -1);
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
        const resp = await GiftCardsRepository.getBookedCards(parseInt(giftCardRequestId), offset, limit);
        res.status(status.success).json(resp);
    } catch (error: any) {
        console.log("[ERROR]", "GiftCardController::getBookedTrees", error);
        res.status(status.error).json({
            message: 'Something went wrong. Please try again later.'
        })
    }
}

export const autoAssignTrees = async (req: Request, res: Response) => {
    const { gift_card_request_id: giftCardRequestId } = req.body;

    try {
        const resp = await GiftCardsRepository.getGiftCardRequests(0, 1, [{ columnField: 'id', operatorValue: 'equals', value: giftCardRequestId }]);
        const giftCardRequest = resp.results[0];

        let memoryImageUrls: string[] | null = null;
        if (giftCardRequest.album_id) {
            const albums = await AlbumRepository.getAlbums({ id: giftCardRequest.album_id });
            if (albums.length === 1) memoryImageUrls = albums[0].images;
        }

        let assigned = 0;
        const giftCards = await GiftCardsRepository.getBookedCards(giftCardRequest.id, 0, -1);
        for (const giftCard of giftCards.results) {
            if (!giftCard.tree_id || !giftCard.gifted_to) {
                continue;
            }

            const updateRequest = {
                assigned_at: new Date(),
                assigned_to: giftCard.assigned_to,
                gifted_to: giftCard.gifted_to,
                updated_at: new Date(),
                description: giftCardRequest.event_name,
                event_type: giftCardRequest.event_type,
                planted_by: null,
                gifted_by: giftCardRequest.user_id,
                gifted_by_name: giftCardRequest.planted_by,
                user_tree_image: giftCard.profile_image_url,
                memory_images: memoryImageUrls,
            }

            await TreeRepository.updateTrees(updateRequest, { id: giftCard.tree_id });
            assigned++;
        }

        if (giftCardRequest.no_of_cards === assigned) {
            giftCardRequest.status = GiftCardRequestStatus.completed;
            giftCardRequest.updated_at = new Date();
            await GiftCardsRepository.updateGiftCardRequest(giftCardRequest);
        }

        res.status(status.success).send();
    } catch (error: any) {
        console.log("[ERROR]", "GiftCardController::autoAssignTrees", error);
        res.status(status.error).json({
            message: 'Something went wrong. Please try again later.'
        })
    }
}

const generateGiftCardTemplate = async (presentationId: string, plantType: string, record: any, keepImages: boolean = false) => {

    const plantTypeCardTemplate = await GiftCardsRepository.getPlantTypeTemplateId(plantType);
    if (!plantTypeCardTemplate) {
        return null;
    }
    const templateId = plantTypeCardTemplate.template_id;

    const slideId = await createSlide(presentationId, templateId, record, keepImages);

    return slideId;
}

const getGiftCardTemplateImage = async (presentationId: string, templateId: string, requestId: string, saplingId: string) => {

    const url = await getSlideThumbnail(presentationId, templateId)
    const s3Url = await uploadImageUrlToS3(url, `cards/${requestId}/thumbnails/${saplingId}.jpg`);

    return s3Url;
}

const getPersonalizedMessage = (primaryMessage: string, userName: string, eventType: string | null, relation?: string | null) => {
    if (eventType === "2") {
        const index = primaryMessage.indexOf('<name here>');
        if (index < 0) return primaryMessage;
        if (relation) {
            return primaryMessage.substring(0, index) + 'your ' + relation.toLocaleLowerCase() + ' ' + `${userName.split(' ')[0]}` + primaryMessage.substring(index + 11)
        }

        return primaryMessage.substring(0, index) +`${userName.split(' ')[0]}` + primaryMessage.substring(index + 11)
    } else {
        const index = primaryMessage.indexOf('your');
        if (index < 0) return primaryMessage;
        if (relation) {
            return primaryMessage.substring(0, index + 5) + relation.toLocaleLowerCase() + ' ' + `${userName.split(' ')[0]}'s` + primaryMessage.substring(index + 4)
        }
    
        return primaryMessage.substring(0, index) + `${userName.split(' ')[0]}'s` + primaryMessage.substring(index + 4)
    }
}

const getPersonalizedMessageForMoreTrees = (primaryMessage: string, count: number) => {
    let message = primaryMessage;
    const index = primaryMessage.indexOf('a tree');
    if (index !== -1) {
        message = primaryMessage.substring(0, index) + count + " trees" + primaryMessage.substring(index + 6);
    }

    const index2 = primaryMessage.indexOf('A tree');
    if (index2 !== -1) {
        message = primaryMessage.substring(0, index2) + count + " trees" + primaryMessage.substring(index2 + 6);
    }

    message = message.replace(/This tree/g, 'These trees');
    message = message.replace(/ tree /g, ' trees ');
    message = message.replace(/ trees has /g, ' trees have ');

    return message
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

        // send the response - because generating cards may take a while. users can download card later
        res.status(status.success).send();

        const presentationId = await copyFile(process.env.GIFT_CARD_PRESENTATION_ID, `${(giftCardRequest as any).group_name || (giftCardRequest as any).user_name}-[${giftCardRequest.id}]`);
        giftCardRequest.presentation_id = presentationId;
        giftCardRequest.updated_at = new Date();
        await GiftCardsRepository.updateGiftCardRequest(giftCardRequest);

        const slideIds: string[] = []
        const userTreeCount: Record<string, number> = {};
        const giftCards = await GiftCardsRepository.getBookedCards(giftCardRequest.id, 0, -1);
        for (const giftCard of giftCards.results) {
            if (!giftCard.tree_id || !giftCard.gifted_to || !giftCard.assigned_to) continue;
            const key = giftCard.gifted_to.toString() + "_" + giftCard.assigned_to.toString();
            if (userTreeCount[key]) userTreeCount[key]++
            else userTreeCount[key] = 1;
        }

        for (const giftCard of giftCards.results) {
            if (!giftCard.tree_id) continue;

            let primaryMessage = giftCardRequest.primary_message;
            if (giftCard.gifted_to && giftCard.assigned_to) {
                const key = giftCard.gifted_to.toString() + "_" + giftCard.assigned_to.toString();
                if (giftCard.assigned_to !== giftCard.gifted_to) primaryMessage = getPersonalizedMessage(primaryMessage, (giftCard as any).assigned_to_name, giftCardRequest.event_type, (giftCard as any).relation);
                if (userTreeCount[key] > 1) primaryMessage = getPersonalizedMessageForMoreTrees(primaryMessage, userTreeCount[key]);
            }

            const record = {
                name: (giftCard as any).gifted_to_name || "",
                sapling: (giftCard as any).sapling_id,
                content1: primaryMessage,
                content2: giftCardRequest.secondary_message,
                logo: giftCardRequest.logo_url,
                logo_message: giftCardRequest.logo_message
            }
            const templateId = await generateGiftCardTemplate(giftCardRequest.presentation_id, (giftCard as any).plant_type, record);
            if (!templateId) continue;

            const templateImage = await getGiftCardTemplateImage(giftCardRequest.presentation_id, templateId, giftCardRequest.request_id, (giftCard as any).sapling_id);
            giftCard.card_image_url = templateImage;
            giftCard.slide_id = templateId;
            await GiftCardsRepository.updateGiftCard(giftCard);

            slideIds.push(templateId);
        }

        await deleteUnwantedSlides(giftCardRequest.presentation_id, slideIds)
        if (giftCardRequest.status === GiftCardRequestStatus.pendingGiftCards) {
            giftCardRequest.status = GiftCardRequestStatus.completed;
        }
        giftCardRequest.updated_at = new Date();
        await GiftCardsRepository.updateGiftCardRequest(giftCardRequest);

    } catch (error: any) {
        console.log("[ERROR]", "GiftCardController::getGiftCardTemplatesForGiftCardRequest", error);
        res.status(status.error).json({
            message: 'Something went wrong. Please try again later.'
        })
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
        if (giftCardRequest.status !== GiftCardRequestStatus.completed) {
            res.status(status.error).json({
                message: 'Gift request is not complete yet!'
            })
            return;
        }

        if (downloadType !== 'zip') {
            const fileData = await downloadSlide(giftCardRequest.presentation_id, mimeType);
            res.setHeader('Content-Type', mimeType);
            res.setHeader('Content-Disposition', `attachment; filename="slide.${downloadType}"`);
            res.send(fileData);
        } else {
            res.setHeader('Content-Disposition', `attachment; filename=${(giftCardRequest as any).user_name + '_' + giftCardRequest.no_of_cards}.zip`);
            res.setHeader('Content-Type', 'application/zip');
            const archive = archiver('zip', {
                zlib: { level: 9 },
            });

            archive.pipe(res);

            const giftCards = await GiftCardsRepository.getBookedCards(giftCardRequest.id, 0, -1);
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
        primary_message: primaryMessage,
        secondary_message: secondaryMessage,
        logo,
        logo_message: logoMessage
    } = req.body;

    if (!process.env.LIVE_GIFT_CARD_PRESENTATION_ID) {
        console.log('[ERROR]', 'GiftCardController::getGiftCardTemplatesForGiftCardRequest', 'Missing live gift card template presentation id in ENV variables.')
        res.status(status.error).json({
            message: 'Something went wrong. Please try again later!'
        })
        return;
    }

    const record = {
        name: "<User's Name>",
        sapling: '00000',
        content1: primaryMessage,
        content2: secondaryMessage,
        logo: logo,
        logo_message: logoMessage
    }

    try {
        let pId: string = process.env.LIVE_GIFT_CARD_PRESENTATION_ID;
        const slideId = await generateGiftCardTemplate(pId, 'Chinch (चिंच)', record, true);

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
        slide_id: slideId,
        primary_message: primaryMessage,
        secondary_message: secondaryMessage,
        logo,
        logo_message: logoMessage
    } = req.body;

    const record = {
        name: "<User's Name>",
        sapling: '00000',
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
    const { gift_card_id: giftCardId, user, tree_id: treeId, profile_image_url: profileImageUrl } = req.body;
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

        const giftCardUser = await GiftCardsRepository.getGiftCard(giftCardId);
        if (!giftCardUser) {
            res.status(status.bad).json({
                message: 'Gift card not found!'
            })
            return;
        }

        const resp = await GiftCardsRepository.getGiftCardRequests(0, 1, [{ columnField: 'id', operatorValue: 'equals', value: giftCardUser.gift_card_request_id }])
        const giftCardRequest = resp.results[0];

        let memoryImageUrls: string[] | null = null;
        if (giftCardRequest.album_id) {
            const albums = await AlbumRepository.getAlbums({ id: giftCardRequest.album_id });
            if (albums.length === 1) memoryImageUrls = albums[0].images;
        }

        const treeUpdateRequest = {
            assigned_at: new Date(),
            assigned_to: userId,
            gifted_to: userId,
            event_type: giftCardRequest.event_type,
            description: giftCardRequest.event_name,
            gifted_by_name: giftCardRequest.planted_by,
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

        giftCardUser.assigned_to = userId;
        giftCardUser.gifted_to = userId;
        giftCardUser.updated_at = new Date();
        await giftCardUser.save();

        res.status(status.success).send();
    } catch (error: any) {
        console.log("[ERROR]", "GiftCardController::updateGiftCard", error);
        res.status(status.bad).send({ message: 'Something went wrong. Please try again later.' });
    }
};

const sendMailsToReceivers = async (giftCardRequest: any, giftCards: any[], eventType: string, attachCard: boolean, ccMails?: string[], testMails?: string[]) => {
    let count = 5;
    const userEmailDataMap: Record<string, any> = {};
    for (const giftCard of giftCards) {
        if (giftCard.mail_sent || !giftCard.user_email || (giftCard.user_email as string).trim().endsWith('@14trees')) continue;

        const key = giftCard.gifted_to + "_" + giftCard.assigned_to;
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
                user_email: giftCard.user_email,
                user_name: giftCard.user_name,
                event_name: giftCard.event_name,
                group_name: giftCardRequest.group_name,
                company_logo_url: giftCardRequest.logo_url,
                assigned_to: giftCard.assigned_to,
                gifted_to: giftCard.gifted_to,
                self: giftCard.assigned_to === giftCard.gifted_to ? true : undefined,
                relation: giftCard.relation,
                relational: giftCard.relation ? true : undefined,
                memorial: giftCard.event_type == "2" ? true : undefined,
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
                        filename: tree.user_name + "_" + tree.card_image_url.split("/").slice(-1)[0],
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

        const statusMessage: string = await sendDashboardMail(templatesMap[templateType], emailData, mailIds, ccMailIds, attachments);
        const updateRequest = {
            mail_sent: (statusMessage === '' && !isTestMail) ? true : false,
            mail_error: statusMessage ? statusMessage : null,
            updated_at: new Date()
        }
        await GiftCardsRepository.updateGiftCards(updateRequest, {
            gift_card_request_id: giftCardRequest.id,
            assigned_to: emailData.assigned_to,
            gifted_to: emailData.gifted_to,
        });

        count = count - 1;
        if (isTestMail && count === 0) break;
    }
}

const sendMailsToAssigneeReceivers = async (giftCardRequest: any, giftCards: any[], eventType: string, attachCard: boolean, ccMails?: string[], testMails?: string[]) => {
    let count = 5;
    const userEmailDataMap: Record<number, any> = {};
    for (const giftCard of giftCards) {
        if (!giftCard.assigned_to_email || (giftCard.assigned_to_email as string).trim().endsWith('@14trees')) continue;
        if (giftCard.event_type === '2') continue;  // memorial

        if (giftCard.assigned_to === giftCard.gifted_to && giftCard.mail_sent) continue;

        const key = giftCard.assigned_to;
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
                assigned_to: giftCard.assigned_to,
                gifted_to: giftCard.gifted_to,
                self: true,
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
                        filename: tree.user_name + "_" + tree.card_image_url.split("/").slice(-1)[0],
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

        await sendDashboardMail(templatesMap[templateType], emailData, mailIds, ccMailIds, attachments);

        count = count - 1;
        if (isTestMail && count === 0) break;
    }
}

const sendMailsToSponsors = async (giftCardRequest: any, giftCards: any[], eventType: string, attachCard: boolean, ccMails?: string[], testMails?: string[]) => {
    const emailData: any = {
        trees: [] as any[],
        user_email: giftCardRequest.user_email,
        user_name: giftCardRequest.user_name,
        event_name: giftCardRequest.event_name,
        group_name: giftCardRequest.group_name,
        company_logo_url: giftCardRequest.logo_url,
        count: 0
    };

    for (const giftCard of giftCards) {

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

        emailData.trees.push(treeData);
        emailData.count++;
    }

    const ccMailIds = (ccMails && ccMails.length !== 0) ? ccMails : undefined;
    const mailIds = (testMails && testMails.length !== 0) ? testMails : [emailData.user_email];

    let attachments: { filename: string; path: string }[] | undefined = undefined;
    if (attachCard) {
        const files: { filename: string; path: string }[] = []
        for (const tree of emailData.trees) {
            if (tree.card_image_url) {
                files.push({
                    filename: tree.user_name + "_" + tree.card_image_url.split("/").slice(-1)[0],
                    path: tree.card_image_url
                })
            }
        }

        if (files.length > 0) attachments = files;
    }

    const templateType: TemplateType = emailData.count > 1 ? 'sponsor-multi-trees' : 'sponsor-single-tree';
    const templates = await EmailTemplateRepository.getEmailTemplates({ event_type: eventType, template_type: templateType })
    if (templates.length === 0) {
        console.log("[ERROR]", "giftCardsController::sendEmailForGiftCardRequest", "Email template not found");
        return;
    }

    const statusMessage: string = await sendDashboardMail(templates[0].template_name, emailData, mailIds, ccMailIds, attachments);

}


export const sendEmailForGiftCardRequest = async (req: Request, res: Response) => {
    const {
        gift_card_request_id: giftCardRequestId,
        test_mails: testMails,
        cc_mails: ccMails,
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

        if (emailSponsor) sendMailsToSponsors(giftCardRequest, giftCards, eventType, attach_card, ccMails, testMails);
        if (emailReceiver) await sendMailsToReceivers(giftCardRequest, giftCards, eventType, attach_card, ccMails, testMails);
        if (emailAssignee) await sendMailsToAssigneeReceivers(giftCardRequest, giftCards, eventType, attach_card, ccMails, testMails);

        res.status(status.success).send();
    } catch (error: any) {
        console.log("[ERROR]", "GiftCardController::sendEmailForGiftCardRequest", error);
        res.status(status.bad).send({ message: 'Something went wrong. Please try again later.' });
    }
}