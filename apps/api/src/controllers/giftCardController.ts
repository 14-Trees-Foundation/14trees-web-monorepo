import { Request, Response } from "express";
import { status } from "../helpers/status";
import { FilterItem } from "../models/pagination";
import { GiftCardsRepository } from "../repo/giftCardsRepo";
import { getOffsetAndLimitFromRequest } from "./helper/request";
import { UserRepository } from "../repo/userRepo";
import { GiftCardRequestAttributes, GiftCardRequestCreationAttributes, GiftCardRequestStatus } from "../models/gift_card_request";
import TreeRepository from "../repo/treeRepo";
import { createSlide, deleteSlide, getSlideThumbnail, updateSlide } from "./helper/slides";
import { UploadFileToS3, uploadImageUrlToS3 } from "./helper/uploadtos3";
import archiver from 'archiver';
import axios from 'axios'
import { Op } from "sequelize";
import { copyFile, downloadSlide } from "../services/google";
import { sendDashboardMail } from "../services/gmail/gmail";


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
        planted_by: plantedBy,
        logo_message: logoMessage,
        request_id: requestId,
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
        planted_by: plantedBy || null,
        logo_message: logoMessage || null,
        status: GiftCardRequestStatus.pendingPlotSelection,
        validation_errors: ['MISSING_LOGO', 'MISSING_USER_DETAILS'],
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

        const presentationId = process.env.GIFT_CARD_PRESENTATION_ID;
        if (presentationId) {
            const newPresentationId = await copyFile(presentationId, requestId);
            giftCard.presentation_id = newPresentationId;
            await giftCard.save();
        }
    } catch (error: any) {
        console.log("[ERROR]", "GiftCardController::createGiftCardRequest", error);
        res.status(status.error).json({
            message: 'Something went wrong. Please try again later.'
        })
    }
}

export const updateGiftCardRequest = async (req: Request, res: Response) => {

    const giftCardRequest: GiftCardRequestAttributes = req.body;
    giftCardRequest.validation_errors = req.body.validation_errors?.split(',') ?? null

    try {

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
        planted_by: null,
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

        await resetGiftCardUsersForRequest(giftCardRequestId);

        const usersData: { userId: number, imageName?: string }[] = []
        for (const user of users) {
            const userResp = await UserRepository.upsertUser(user);
            usersData.push({
                userId: userResp.id,
                imageName: user.image_name ? user.image_name : undefined
            });
        }

        await GiftCardsRepository.createGiftCards(giftCardRequestId, usersData);

        const resp = await GiftCardsRepository.getGiftCardRequests(0, 1, [{ columnField: 'id', value: giftCardRequestId, operatorValue: 'equals' }])

        // validation on user details
        const giftCardRequest: GiftCardRequestAttributes = resp.results[0];
        if (giftCardRequest.no_of_cards !== usersData.length && !giftCardRequest.validation_errors?.includes('MISSING_USER_DETAILS')) {
            giftCardRequest.validation_errors = giftCardRequest.validation_errors ? [...giftCardRequest.validation_errors, 'MISSING_USER_DETAILS'] : ['MISSING_USER_DETAILS']
        } else if (giftCardRequest.validation_errors?.includes('MISSING_USER_DETAILS')) {
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
    const { gift_card_request_id: giftCardRequestId } = req.body;
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

        const treeIds = await TreeRepository.mapTreesInPlotToUserAndGroup(giftCardRequest.user_id, giftCardRequest.group_id, plotIds, giftCardRequest.no_of_cards);
        await GiftCardsRepository.bookGiftCards(giftCardRequestId, treeIds);

        giftCardRequest.is_active = true;
        giftCardRequest.status = GiftCardRequestStatus.pendingAssignment;
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

        const giftCards = await GiftCardsRepository.getBookedCards(giftCardRequest.id, 0, -1);
        let allAssigned = true;
        for (const giftCard of giftCards.results) {
            if (!giftCard.tree_id || !giftCard.user_id) {
                allAssigned = false;
                continue;
            }

            const updateRequest = {
                assigned_at: new Date(),
                assigned_to: giftCard.user_id,
                update_at: new Date(),
                description: giftCardRequest.event_name,
                planted_by: giftCardRequest.planted_by,
                user_tree_image: giftCard.profile_image_url
            }

            await TreeRepository.updateTrees(updateRequest, { id: giftCard.tree_id });
        }

        if (allAssigned) {
            giftCardRequest.status = GiftCardRequestStatus.pendingGiftCards;
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

const generateGiftCardTemplate = async (presentationId: string, plantType: string, record: any) => {

    const plantTypeCardTemplate = await GiftCardsRepository.getPlantTypeTemplateId(plantType);
    if (!plantTypeCardTemplate) {
        throw new Error("Plant type card template not found");
    }
    const templateId = plantTypeCardTemplate.template_id;

    const slideId = await createSlide(presentationId, templateId, record);

    return slideId;
}

const getGiftCardTemplateImage = async (presentationId: string, templateId: string, requestId: string, saplingId: string) => {

    const url = await getSlideThumbnail(presentationId, templateId)
    const s3Url = await uploadImageUrlToS3(url, `gift-card-requests/${requestId}/thumbnails/${saplingId}.jpg`);

    return s3Url;
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

        if (!giftCardRequest.presentation_id) {
            if (!process.env.GIFT_CARD_PRESENTATION_ID) {
                console.log('[ERROR]', 'GiftCardController::getGiftCardTemplatesForGiftCardRequest', 'Missing gift card template presentation id in ENV variables.')
                res.status(status.error).json({
                    message: 'Something went wrong. Please try again later!'
                })
                return;
            }

            const presentationId = await copyFile(process.env.GIFT_CARD_PRESENTATION_ID, giftCardRequest.request_id);
            giftCardRequest.presentation_id = presentationId;
            giftCardRequest.updated_at = new Date();
            await GiftCardsRepository.updateGiftCardRequest(giftCardRequest);
        }

        let allCardsGenerated = true;
        const giftCards = await GiftCardsRepository.getBookedCards(giftCardRequest.id, 0, -1);
        for (const giftCard of giftCards.results) {
            if (!giftCard.tree_id || !giftCard.user_id) {
                allCardsGenerated = false;
                continue;
            }

            let templateImage = giftCard.card_image_url;
            if (!templateImage) {
                const record = {
                    name: (giftCard as any).user_name,
                    sapling: (giftCard as any).sapling_id,
                    content1: giftCardRequest.primary_message,
                    content2: giftCardRequest.secondary_message,
                    logo: giftCardRequest.logo_url,
                    logo_message: giftCardRequest.logo_message
                }
                const templateId = await generateGiftCardTemplate(giftCardRequest.presentation_id, (giftCard as any).plant_type, record);
                const templateImage = await getGiftCardTemplateImage(giftCardRequest.presentation_id, templateId, giftCardRequest.request_id, (giftCard as any).sapling_id);

                giftCard.card_image_url = templateImage;
                await GiftCardsRepository.updateGiftCard(giftCard);
                await GiftCardsRepository.addGiftCardTemplate(giftCard.id, templateId);
            }
        }

        if (allCardsGenerated) {
            giftCardRequest.status = GiftCardRequestStatus.completed;
            giftCardRequest.updated_at = new Date();
            await GiftCardsRepository.updateGiftCardRequest(giftCardRequest);
        }

        res.status(status.success).send();
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

export const generateGiftCardTemplateForSapling = async (req: Request, res: Response) => {
    const { gift_card_id: giftCardId, sapling_id: saplingId, user, content1, content2 } = req.body;
    if (!giftCardId || isNaN(parseInt(giftCardId))) {
        res.status(status.bad).json({
            message: 'Please provide valid input details!'
        })
        return;
    }

    const presentationId = process.env.GIFT_CARD_PRESENTATION_ID;
    if (!presentationId) {
        console.log("[ERROR]", "GiftCardController::generateGiftCardTemplateForSapling", "Missing gift card template presentation id from env file");
        res.status(status.bad).json({
            message: 'Something went wrong. Please try again later!'
        })
        return;
    }

    try {

        const template = await GiftCardsRepository.getGiftCardTemplate(parseInt(giftCardId));
        if (template) {
            res.status(status.success).json({
                slide_id: template.template_id
            })
            return;
        }

        const giftCardUser = await GiftCardsRepository.getDetailedGiftCard(parseInt(giftCardId));
        if (!giftCardUser) {
            res.status(status.bad).json({
                message: 'Gift card not found!'
            })
            return;
        }

        const giftCard = await GiftCardsRepository.getGiftCardRequests(0, 1, [{ columnField: 'id', operatorValue: 'equals', value: giftCardUser.gift_card_request_id }]);
        if (giftCard.results.length === 0) {
            res.status(status.bad).json({
                message: 'Gift card not found!'
            })
            return;
        }

        const plantTypeCardTemplate = await GiftCardsRepository.getPlantTypeTemplateId((giftCardUser as any).plant_type);
        if (!plantTypeCardTemplate) {
            res.status(status.bad).json({
                message: 'Plant type template not found. Please contact support!'
            })
            return;
        }
        const templateId = plantTypeCardTemplate.template_id;

        const record = {
            name: user?.name || '<Your Name>',
            sapling: saplingId,
            content1,
            content2,
            logo: giftCard.results[0].logo_url
        }


        const slideId = await createSlide(presentationId, templateId, record)

        await GiftCardsRepository.addGiftCardTemplate(parseInt(giftCardId), slideId);
        res.status(status.success).json({
            slide_id: slideId
        })
    } catch (error: any) {
        console.log("[ERROR]", "GiftCardController::generateGiftCardTemplateForSapling", error);
        res.status(status.error).json({
            message: 'Something went wrong. Please try again later.'
        })
    }
}

export const updateGiftCardTemplate = async (req: Request, res: Response) => {
    const { gift_card_id: giftCardId, user, content1, content2 } = req.body;
    if (!giftCardId || isNaN(parseInt(giftCardId))) {
        res.status(status.bad).json({
            message: 'Please provide valid input details!'
        })
        return;
    }

    const presentationId = process.env.GIFT_CARD_PRESENTATION_ID;
    if (!presentationId) {
        console.log("[ERROR]", "GiftCardController::generateGiftCardTemplateForSapling", "Missing gift card template presentation id from env file");
        res.status(status.bad).json({
            message: 'Something went wrong. Please try again later!'
        })
        return;
    }

    try {
        const record = {
            name: user?.name || '<Your Name>',
            sapling: '',
            content1,
            content2,
        }

        const giftCardUserTemplate = await GiftCardsRepository.getGiftCardTemplate(parseInt(giftCardId));
        if (!giftCardUserTemplate) {
            res.status(status.bad).json({
                message: 'Gift card user template not found!'
            })
            return;
        }

        await updateSlide(presentationId, giftCardUserTemplate.template_id, record)
        res.status(status.success).send();
    } catch (error: any) {
        console.log("[ERROR]", "GiftCardController::updateGiftCard", error);
        res.status(status.bad).send({ message: 'Something went wrong. Please try again later.' });
    }
};

export const redeemGiftCard = async (req: Request, res: Response) => {
    const { gift_card_id: giftCardId, user, sapling_id: saplingId, tree_id: treeId } = req.body;
    if (!giftCardId || isNaN(parseInt(giftCardId))) {
        res.status(status.bad).json({
            message: 'Please provide valid input details!'
        })
        return;
    }

    const presentationId = process.env.GIFT_CARD_PRESENTATION_ID;
    if (!presentationId) {
        console.log("[ERROR]", "GiftCardController::generateGiftCardTemplateForSapling", "Missing gift card template presentation id from env file");
        res.status(status.bad).json({
            message: 'Something went wrong. Please try again later!'
        })
        return;
    }

    try {

        const giftCardUser = await GiftCardsRepository.getGiftCard(parseInt(giftCardId));
        if (!giftCardUser) {
            res.status(status.bad).json({
                message: 'Gift card not found!'
            })
            return;
        }

        const giftCardUserTemplate = await GiftCardsRepository.getGiftCardTemplate(parseInt(giftCardId));
        if (!giftCardUserTemplate) {
            res.status(status.bad).json({
                message: 'Gift card template not found!'
            })
            return;
        }

        const resp = await GiftCardsRepository.getGiftCardRequests(0, 1, [{ columnField: 'id', operatorValue: 'equals', value: giftCardUser.gift_card_request_id }])
        const giftCardRequest = resp.results[0];

        const url = await getSlideThumbnail(presentationId, giftCardUserTemplate.template_id)
        const s3Url = await uploadImageUrlToS3(url, `gift-card-requests/${giftCardRequest.request_id}/thumbnails/${saplingId}.jpg`);

        const treeUpdateRequest = {
            assigned_at: new Date(),
            assigned_to: user?.id,
        }

        const updatedCount = await TreeRepository.updateTrees(treeUpdateRequest, { id: treeId })
        if (!updatedCount) {
            res.status(status.bad).json({
                message: 'Tree not found!'
            })
            return;
        }

        giftCardUser.card_image_url = s3Url;
        giftCardUser.user_id = user?.id;
        giftCardUser.updated_at = new Date();
        await giftCardUser.save();

        const updatedGiftCardUser = await GiftCardsRepository.getDetailedGiftCard(parseInt(giftCardId));

        GiftCardsRepository.deleteGiftCardTemplate(parseInt(giftCardId));
        deleteSlide(presentationId, giftCardUserTemplate.template_id);

        res.status(status.success).send(updatedGiftCardUser);
    } catch (error: any) {
        console.log("[ERROR]", "GiftCardController::updateGiftCard", error);
        res.status(status.bad).send({ message: 'Something went wrong. Please try again later.' });
    }
};


export const sendEmailForGiftCardRequest = async (req: Request, res: Response) => {
    const { gift_card_request_id: giftCardRequestId } = req.params;
    if (!giftCardRequestId || isNaN(parseInt(giftCardRequestId))) {
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
        for (const giftCard of giftCards) {
            if (giftCard.mail_sent || !giftCard.user_email || (giftCard.user_email as string).trim().endsWith('@14trees')) continue;

            const emailData = {
                ...giftCard,
                dashboard_link: 'https://dashboard.14trees.org/profile/' + giftCard.sapling_id,
                group_name: giftCardRequest.group_name
            }

            const statusMessage = await sendDashboardMail(giftCard.user_email, emailData);
            const updateRequest = {
                mail_sent: statusMessage === '' ? true : false,
                mail_error: statusMessage ? statusMessage : null,
                updated_at: new Date()
            }
            await GiftCardsRepository.updateGiftCards(updateRequest, { id: giftCard.id });
        }

        res.status(status.success).send();
    } catch (error: any) {
        console.log("[ERROR]", "GiftCardController::sendEmailForGiftCardRequest", error);
        res.status(status.bad).send({ message: 'Something went wrong. Please try again later.' });
    }
}