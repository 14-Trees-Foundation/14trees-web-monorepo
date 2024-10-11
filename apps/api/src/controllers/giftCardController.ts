import { Request, Response } from "express";
import { status } from "../helpers/status";
import { FilterItem } from "../models/pagination";
import { GiftCardsRepository } from "../repo/giftCardsRepo";
import { getOffsetAndLimitFromRequest } from "./helper/request";
import { UserRepository } from "../repo/userRepo";
import { GiftCardRequestCreationAttributes } from "../models/gift_card_request";
import TreeRepository from "../repo/treeRepo";
import { createSlide, deleteSlide, getSlideThumbnail, updateSlide } from "./helper/slides";
import { UploadFileToS3, uploadCardTemplateToS3 } from "./helper/uploadtos3";


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
        logo_message: logoMessage
    } = req.body;

    if (!userId || !noOfCards) {
        res.status(status.bad).json({
            message: 'Please provide valid input details!'
        })
    }

    const request: GiftCardRequestCreationAttributes = {
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
        logo_message: logoMessage || null
    }

    try {
        let giftCard = await GiftCardsRepository.createGiftCardRequest(request);

        let imageChange = false;
        const files: { logo: Express.Multer.File[], csv_file: Express.Multer.File[] } = req.files as any;
        if (files.logo && files.logo.length > 0) {
            const location = await UploadFileToS3(files.logo[0].filename, "gift_cards", giftCard.id.toString());
            giftCard.logo_url = location;
            imageChange = true;
        }

        if (files.csv_file && files.csv_file.length > 0) {
            const location = await UploadFileToS3(files.csv_file[0].filename, "gift_cards", giftCard.id.toString());
            giftCard.users_csv_file_url = location;
            imageChange = true;
        }

        if (imageChange) giftCard = await giftCard.save();
        res.status(status.success).json(giftCard);
    } catch (error: any) {
        console.log("[ERROR]", "GiftCardController::createGiftCardRequest", error);
        res.status(status.error).json({
            message: 'Something went wrong. Please try again later.'
        })
    }
}

export const updateGiftCardRequest = async (req: Request, res: Response) => {
    try {
        const updatedGiftCard = await GiftCardsRepository.updateGiftCardRequest(req.body)
        res.status(status.success).json(updatedGiftCard);
    } catch (error: any) {
        console.log("[ERROR]", "GiftCardController::updateGiftCardRequest", error);
        res.status(status.bad).send({ message: 'Something went wrong. Please try again later.' });
    }
};

export const deleteGiftCardRequest = async (req: Request, res: Response) => {
    const cardId = parseInt(req.params.id)
    if (isNaN(cardId)) {
        res.status(status.bad).send({ message: "Gift card id is required" });
        return;
    }
    try {
        let resp = await GiftCardsRepository.deleteGiftCardRequest(parseInt(req.params.id));
        console.log(`Deleted Gift card with id: ${req.params.id}`, resp);
        res.status(status.success).json("Gift card deleted successfully");
    } catch (error: any) {
        res.status(status.error).json({
            status: status.error,
            message: error.message,
        });
    }
};

export const createGiftCards = async (req: Request, res: Response) => {
    const { users, gift_card_request_id: giftCardRequestId } = req.body;

    if (!giftCardRequestId || !users || users.length === 0) {
        res.status(status.bad).json({
            message: 'Please provide valid input details!'
        })
    }

    try {
        const userIds: number[] = []
        for (const user of users) {
            const userResp = await UserRepository.upsertUser(user);
            userIds.push(userResp.id);
        }

        await GiftCardsRepository.createGiftCards(giftCardRequestId, userIds);
        res.status(status.success).send();
    } catch (error: any) {
        console.log("[ERROR]", "GiftCardController::createGiftCards", error);
        res.status(status.error).json({
            message: 'Something went wrong. Please try again later.'
        })
    }
}

export const createGiftCardPlots = async (req: Request, res: Response) => {
    const { plot_ids: plotIds, gift_card_id: giftCardId } = req.body;

    if (!giftCardId || !plotIds || plotIds.length === 0) {
        res.status(status.bad).json({
            message: 'Please provide valid input details!'
        })
    }

    try {
        await GiftCardsRepository.addGiftCardPlots(giftCardId, plotIds);
        res.status(status.success).send();
    } catch (error: any) {
        console.log("[ERROR]", "GiftCardController::createGiftCardPlots", error);
        res.status(status.error).json({
            message: 'Something went wrong. Please try again later.'
        })
    }
}

export const bookGiftCardTrees = async (req: Request, res: Response) => {
    const {  gift_card_request_id: giftCardRequestId } = req.body;
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

        const treeIds = await TreeRepository.mapTreesInPlot('user', giftCardRequest.user_id as any, plotIds, giftCardRequest.no_of_cards);
        await GiftCardsRepository.bookGiftCards(giftCardRequestId, treeIds);

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
    const {  gift_card_request_id: giftCardRequestId } = req.params;
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

export const generateGiftCardTemplateForSapling = async (req: Request, res: Response) => {
    const {  gift_card_id: giftCardId, sapling_id: saplingId, user, content1, content2 } = req.body;
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
    const {  gift_card_id: giftCardId, user, content1, content2 } = req.body;
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
    const {  gift_card_id: giftCardId, user, sapling_id: saplingId, tree_id: treeId } = req.body;
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
        const giftCardUserTemplate = await GiftCardsRepository.getGiftCardTemplate(parseInt(giftCardId));
        if (!giftCardUserTemplate) {
            res.status(status.bad).json({
                message: 'Gift card template not found!'
            })
            return;
        }
        
        const url = await getSlideThumbnail(presentationId, giftCardUserTemplate.template_id)
        const s3Url = await uploadCardTemplateToS3(url, saplingId);

        const giftCardUser = await GiftCardsRepository.getGiftCard(parseInt(giftCardId));
        if (!giftCardUser) {
            res.status(status.bad).json({
                message: 'Gift card not found!'
            })
            return;
        }

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

