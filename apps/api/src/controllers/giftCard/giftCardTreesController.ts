import { Request, Response } from "express";
import { status } from "../../helpers/status";
import { Logger } from "../../helpers/logger";
import { getOffsetAndLimitFromRequest } from "../helper/request";
import GiftCardTreesService from "../../facade/giftCard/giftCardTreesService";
import { BookTreesBody } from "../helper/giftCard/types";
import { GiftCardValidation } from "../helper/giftCard/validation";

export const createGiftCardPlots = async (req: Request, res: Response) => {
    try {
        const { plot_ids: plotIds, gift_card_request_id: giftCardRequestId } = req.body;

        if (!giftCardRequestId || !plotIds || plotIds.length === 0) {
            return res.status(status.bad).json({
                message: 'Please provide valid input details!'
            });
        }

        await GiftCardTreesService.createGiftCardPlots(giftCardRequestId, plotIds);
        res.status(status.success).send();
    } catch (error: any) {
        console.log("[ERROR]", "GiftCardTreesController::createGiftCardPlots", error);
        await Logger.logError('giftCardTreesController', 'createGiftCardPlots', error, req);
        res.status(status.error).json({
            message: 'Something went wrong. Please try again later.'
        });
    }
}

export const bookTreesForGiftRequest = async (req: Request, res: Response) => {
    try {
        const requestBody: BookTreesBody = req.body;
        const { 
            gift_card_request_id: giftCardRequestId, 
            gift_card_trees: trees, 
            diversify, 
            book_non_giftable, 
            book_all_habits 
        } = requestBody;

        // Validate input
        const validation = GiftCardValidation.validateBookTrees(requestBody);
        if (!validation.isValid) {
            return res.status(status.bad).json({
                message: 'Validation failed',
                errors: validation.errors
            });
        }

        const userId = req.headers['x-user-id'] as string;
        const userIdNum = userId && !isNaN(parseInt(userId)) ? parseInt(userId) : undefined;

        await GiftCardTreesService.bookTreesForGiftRequest(
            giftCardRequestId, 
            trees, 
            diversify, 
            book_non_giftable, 
            book_all_habits,
            userIdNum
        );

        res.status(status.success).send();

    } catch (error: any) {
        console.log("[ERROR]", "GiftCardTreesController::bookTreesForGiftRequest", error);
        await Logger.logError('giftCardTreesController', 'bookTreesForGiftRequest', error, req);
        
        if (error.message.includes('not found') || 
            error.message.includes('assign plot') || 
            error.message.includes('not available') ||
            error.message.includes('already assigned')) {
            res.status(status.bad).json({ message: error.message });
        } else {
            res.status(status.error).json({
                message: 'Something went wrong. Please try again later.'
            });
        }
    }
}

export const bookGiftCardTrees = async (req: Request, res: Response) => {
    try {
        const { 
            gift_card_request_id: giftCardRequestId, 
            gift_card_trees: giftCardTrees, 
            diversify, 
            book_non_giftable 
        } = req.body;

        if (!giftCardRequestId) {
            return res.status(status.bad).json({
                message: 'Please provide valid input details!'
            });
        }

        await GiftCardTreesService.bookGiftCardTrees(
            giftCardRequestId, 
            giftCardTrees, 
            diversify, 
            book_non_giftable
        );

        res.status(status.success).send();

    } catch (error: any) {
        console.log("[ERROR]", "GiftCardTreesController::bookGiftCardTrees", error);
        await Logger.logError('giftCardTreesController', 'bookGiftCardTrees', error, req);
        
        if (error.message.includes('not found') || error.message.includes('assign plot')) {
            res.status(status.bad).json({ message: error.message });
        } else {
            res.status(status.error).json({
                message: 'Something went wrong. Please try again later.'
            });
        }
    }
}

export const getBookedTrees = async (req: Request, res: Response) => {
    try {
        const { offset, limit } = getOffsetAndLimitFromRequest(req);
        const { gift_card_request_id: giftCardRequestId } = req.params;
        
        if (!giftCardRequestId || isNaN(parseInt(giftCardRequestId))) {
            return res.status(status.bad).json({
                message: 'Please provide valid input details!'
            });
        }

        const resp = await GiftCardTreesService.getBookedTrees(offset, limit, parseInt(giftCardRequestId));
        res.status(status.success).json(resp);
    } catch (error: any) {
        console.log("[ERROR]", "GiftCardTreesController::getBookedTrees", error);
        await Logger.logError('giftCardTreesController', 'getBookedTrees', error, req);
        res.status(status.error).json({
            message: 'Something went wrong. Please try again later.'
        });
    }
}

export const unBookTrees = async (req: Request, res: Response) => {
    try {
        const { 
            gift_card_request_id: giftCardRequestId, 
            tree_ids: treeIds, 
            unmap_all: unmapAll 
        } = req.body;

        if (!giftCardRequestId) {
            return res.status(status.bad).json({
                message: 'Please provide valid input details!'
            });
        }

        await GiftCardTreesService.unBookTrees(giftCardRequestId, treeIds, unmapAll);
        res.status(status.success).send();

    } catch (error: any) {
        console.log("[ERROR]", "GiftCardTreesController::unBookTrees", error);
        await Logger.logError('giftCardTreesController', 'unBookTrees', error, req);
        res.status(status.error).json({
            message: 'Something went wrong. Please try again later.'
        });
    }
}

export const getTreesCountForAutoReserveTrees = async (req: Request, res: Response) => {
    try {
        const { gift_card_request_id: giftCardRequestId } = req.params;

        if (!giftCardRequestId || isNaN(parseInt(giftCardRequestId))) {
            return res.status(status.bad).json({
                message: 'Please provide valid gift card request ID!'
            });
        }

        const result = await GiftCardTreesService.getTreesCountForAutoReserveTrees(parseInt(giftCardRequestId));
        res.status(status.success).json(result);

    } catch (error: any) {
        console.log("[ERROR]", "GiftCardTreesController::getTreesCountForAutoReserveTrees", error);
        await Logger.logError('giftCardTreesController', 'getTreesCountForAutoReserveTrees', error, req);
        res.status(status.error).json({
            message: 'Something went wrong. Please try again later.'
        });
    }
}

export const autoProcessGiftCardRequest = async (req: Request, res: Response) => {
    try {
        const { gift_card_request_id: giftCardRequestId } = req.body;

        if (!giftCardRequestId) {
            return res.status(status.bad).json({
                message: 'Please provide valid gift card request ID!'
            });
        }

        const result = await GiftCardTreesService.autoBookTreesForGiftRequest(giftCardRequestId);
        res.status(status.success).json(result);

    } catch (error: any) {
        console.log("[ERROR]", "GiftCardTreesController::autoProcessGiftCardRequest", error);
        await Logger.logError('giftCardTreesController', 'autoProcessGiftCardRequest', error, req);
        res.status(status.error).json({
            message: 'Something went wrong. Please try again later.'
        });
    }
}