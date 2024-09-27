import { Request, Response } from "express";
import { status } from "../helpers/status";
import { FilterItem } from "../models/pagination";
import { GiftCardsRepository } from "../repo/giftCardsRepo";
import { getOffsetAndLimitFromRequest } from "./helper/request";
import { UserRepository } from "../repo/userRepo";
import { GiftCardCreationAttributes } from "../models/gift_card";
import TreeRepository from "../repo/treeRepo";
import { createSlide, deleteSlide, getSlideThumbnail, updateSlide } from "./helper/slides";
import { UploadFileToS3, uploadCardTemplateToS3 } from "./helper/uploadtos3";


export const getGiftCards = async (req: Request, res: Response) => {
    const { offset, limit } = getOffsetAndLimitFromRequest(req);
    const filters: FilterItem[] = req.body?.filters;

    const giftCards = await GiftCardsRepository.getGiftCards(offset, limit, filters);
    giftCards.results.forEach((giftCard: any) => {
        giftCard.plot_ids = giftCard.plot_ids.filter((plot_id: any) => plot_id !== null);
    })
    res.status(status.success).json(giftCards);
}

export const addGiftCard = async (req: Request, res: Response) => {
    const { user_id: userId, group_id: groupId, no_of_cards: noOfCards } = req.body;

    if (!userId || !noOfCards) {
        res.status(status.bad).json({
            message: 'Please provide valid input details!'
        })
    }

    const request: GiftCardCreationAttributes = {
        user_id: userId,
        group_id: groupId || null,
        no_of_cards: noOfCards,
        is_active: false,
        created_at: new Date(),
        updated_at: new Date(),
    }

    try {

        if (req.file) {
            const location = await UploadFileToS3(req.file.filename, "logos");
            request.logo_url = location;
        }
        const giftCard = await GiftCardsRepository.addGiftCard(request);
        res.status(status.success).json(giftCard);
    } catch (error: any) {
        console.log("[ERROR]", "GiftCardController::addGiftCard", error);
        res.status(status.error).json({
            message: 'Something went wrong. Please try again later.'
        })
    }
}

export const updateGiftCard = async (req: Request, res: Response) => {
    try {
        const updatedGiftCard = await GiftCardsRepository.updateGiftCard(req.body)
        res.status(status.success).json(updatedGiftCard);
    } catch (error: any) {
        console.log("[ERROR]", "GiftCardController::updateGiftCard", error);
        res.status(status.bad).send({ message: 'Something went wrong. Please try again later.' });
    }
};

export const deleteGiftCard = async (req: Request, res: Response) => {
    const cardId = parseInt(req.params.id)
    if (isNaN(cardId)) {
        res.status(status.bad).send({ message: "Gift card id is required" });
        return;
    }
    try {
        let resp = await GiftCardsRepository.deleteGiftCard(parseInt(req.params.id));
        console.log(`Deleted Gift card with id: ${req.params.id}`, resp);
        res.status(status.success).json("Gift card deleted successfully");
    } catch (error: any) {
        res.status(status.error).json({
            status: status.error,
            message: error.message,
        });
    }
};

export const createGiftCardUsers = async (req: Request, res: Response) => {
    const { users, gift_card_id: giftCardId } = req.body;

    if (!giftCardId || !users || users.length === 0) {
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

        await GiftCardsRepository.addGiftCardUsers(giftCardId, userIds);
        res.status(status.success).send();
    } catch (error: any) {
        console.log("[ERROR]", "GiftCardController::createGiftCardUsers", error);
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
    const {  gift_card_id: giftCardId } = req.body;
    if (!giftCardId) {
        res.status(status.bad).json({
            message: 'Please provide valid input details!'
        })
    }

    try {
        const resp = await GiftCardsRepository.getGiftCards(0, 1, [{ columnField: 'id', operatorValue: 'equals', value: giftCardId }]);
        const giftCard = resp.results[0];

        const giftCardPlotMapping = await GiftCardsRepository.getGiftCardPlots(giftCardId);
        const plotIds = giftCardPlotMapping.map(plot => plot.plot_id);
        if (plotIds.length === 0) {
            res.status(status.bad).json({
                message: 'Please assign plot to this request first!'
            })
            return;
        }

        const treeIds = await TreeRepository.mapTreesInPlot('user', giftCard.user_id as any, plotIds, giftCard.no_of_cards);
        await GiftCardsRepository.bookGiftCards(giftCardId, treeIds);

        giftCard.is_active = true;
        giftCard.updated_at = new Date();
        await GiftCardsRepository.updateGiftCard(giftCard);

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
    const {  gift_card_id: giftCardId } = req.params;
    if (!giftCardId || isNaN(parseInt(giftCardId))) {
        res.status(status.bad).json({
            message: 'Please provide valid input details!'
        })
    }

    try {
        const resp = await GiftCardsRepository.getBookedCards(parseInt(giftCardId), offset, limit);
        res.status(status.success).json(resp);
    } catch (error: any) {
        console.log("[ERROR]", "GiftCardController::getBookedTrees", error);
        res.status(status.error).json({
            message: 'Something went wrong. Please try again later.'
        })
    }
}

export const generateGiftCardTemplateForSapling = async (req: Request, res: Response) => {
    const {  gift_card_user_id: giftCardUserId, sapling_id: saplingId, user, content1, content2 } = req.body;
    if (!giftCardUserId || isNaN(parseInt(giftCardUserId))) {
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

        const template = await GiftCardsRepository.getGiftCardTemplate(parseInt(giftCardUserId));
        if (template) {
            res.status(status.success).json({
                slide_id: template.template_id
            })
            return;
        }
        
        const giftCardUser = await GiftCardsRepository.getDetailedGiftCardUser(parseInt(giftCardUserId));
        if (!giftCardUser) {
            res.status(status.bad).json({
                message: 'Gift card user not found!'
            })
            return;
        }

        const giftCard = await GiftCardsRepository.getGiftCards(0, 1, [{ columnField: 'id', operatorValue: 'equals', value: giftCardUser.card_id }]);
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

        await GiftCardsRepository.addGiftCardTemplate(parseInt(giftCardUserId), slideId);
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
    const {  gift_card_user_id: giftCardUserId, user, content1, content2 } = req.body;
    if (!giftCardUserId || isNaN(parseInt(giftCardUserId))) {
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

        const giftCardUserTemplate = await GiftCardsRepository.getGiftCardTemplate(parseInt(giftCardUserId));
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
    const {  gift_card_user_id: giftCardUserId, user, sapling_id: saplingId, tree_id: treeId } = req.body;
    if (!giftCardUserId || isNaN(parseInt(giftCardUserId))) {
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
        const giftCardUserTemplate = await GiftCardsRepository.getGiftCardTemplate(parseInt(giftCardUserId));
        if (!giftCardUserTemplate) {
            res.status(status.bad).json({
                message: 'Gift card user template not found!'
            })
            return;
        }
        
        const url = await getSlideThumbnail(presentationId, giftCardUserTemplate.template_id)
        const s3Url = await uploadCardTemplateToS3(url, saplingId);

        const giftCardUser = await GiftCardsRepository.getGiftCardUser(parseInt(giftCardUserId));
        if (!giftCardUser) {
            res.status(status.bad).json({
                message: 'Gift card user not found!'
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

        const updatedGiftCardUser = await GiftCardsRepository.getDetailedGiftCardUser(parseInt(giftCardUserId));

        GiftCardsRepository.deleteGiftCardTemplate(parseInt(giftCardUserId));
        deleteSlide(presentationId, giftCardUserTemplate.template_id);

        res.status(status.success).send(updatedGiftCardUser);
    } catch (error: any) {
        console.log("[ERROR]", "GiftCardController::updateGiftCard", error);
        res.status(status.bad).send({ message: 'Something went wrong. Please try again later.' });
    }
};

