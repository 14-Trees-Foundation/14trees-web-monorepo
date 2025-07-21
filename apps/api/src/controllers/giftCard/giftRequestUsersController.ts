import { Request, Response } from "express";
import { status } from "../../helpers/status";
import { Logger } from "../../helpers/logger";
import { GiftRequestUserInput } from "../../models/gift_request_user";
import { GiftCardsRepository } from "../../repo/giftCardsRepo";
import GiftRequestUsersService from "../../facade/giftCard/giftRequestUsersService";
import { UpsertUsersBody } from "../helper/giftCard/types";
import { GiftCardValidation } from "../helper/giftCard/validation";
import { GiftCardUtils } from "../helper/giftCard/utils";

export const getGiftRequestUsers = async (req: Request, res: Response) => {
    try {
        const giftCardRequestId = parseInt(req.params.gift_card_request_id);
        
        if (isNaN(giftCardRequestId)) {
            return res.status(status.bad).send({ 
                message: "Gift card request id is required" 
            });
        }

        const giftCardRequestUsers = await GiftRequestUsersService.getGiftRequestUsers(giftCardRequestId);
        res.status(status.success).json(giftCardRequestUsers);
    } catch (error: any) {
        console.log("[ERROR]", "GiftRequestUsersController::getGiftRequestUsers", error);
        await Logger.logError('giftRequestUsersController', 'getGiftRequestUsers', error, req);
        res.status(status.error).json({
            message: 'Something went wrong. Please try again later.'
        });
    }
}

export const upsertGiftRequestUsers = async (req: Request, res: Response) => {
    try {
        const requestBody: UpsertUsersBody = req.body;
        const { gift_card_request_id: giftCardRequestId, users } = requestBody;

        console.log('=== UPSERT GIFT REQUEST USERS ===');
        console.log('Gift Card Request ID:', giftCardRequestId);
        console.log('Users received:', JSON.stringify(users, null, 2));

        // Validate input
        const validation = GiftCardValidation.validateUpsertUsers(requestBody);
        if (!validation.isValid) {
            return res.status(status.bad).json({
                message: 'Validation failed',
                errors: validation.errors
            });
        }

        // Get gift card request
        const resp = await GiftCardsRepository.getGiftCardRequests(0, 1, [
            { columnField: 'id', value: giftCardRequestId, operatorValue: 'equals' }
        ]);
        const giftCardRequest = resp.results[0];

        if (!giftCardRequest) {
            return res.status(status.notfound).json({
                message: 'Gift card request not found'
            });
        }

        const updated = await GiftRequestUsersService.upsertGiftRequestUsers(giftCardRequest, users);

        res.status(status.success).json({
            ...(updated as any),
            presentation_ids: GiftCardUtils.filterNullValues((updated as any)?.presentation_ids || []),
        });

    } catch (error: any) {
        console.log("[ERROR]", "GiftRequestUsersController::upsertGiftRequestUsers", error);
        await Logger.logError('giftRequestUsersController', 'upsertGiftRequestUsers', error, req);
        res.status(status.error).json({
            message: 'Something went wrong. Please try again later.'
        });
    }
}

export const updateGiftCardUserDetails = async (req: Request, res: Response) => {
    try {
        const users: any[] = req.body.users;

        if (!users || users.length === 0) {
            return res.status(status.bad).send({
                status: status.bad,
                message: "Invalid request!"
            });
        }

        const result = await GiftRequestUsersService.updateGiftCardUserDetails(users);

        if (result.failureCount !== 0) {
            res.status(status.error).send({
                code: status.error,
                message: `Failed to update ${result.failureCount} users!`
            });
        } else {
            res.status(status.success).send();
        }
    } catch (error: any) {
        console.log("[ERROR]", "GiftRequestUsersController::updateGiftCardUserDetails", error);
        await Logger.logError('giftRequestUsersController', 'updateGiftCardUserDetails', error, req);
        res.status(status.error).json({
            message: 'Something went wrong. Please try again later.'
        });
    }
}