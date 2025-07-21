import { Request, Response } from "express";
import { GiftCardRedemptionService } from "../../facade/giftCard/giftCardRedemptionService";
import { status } from "../../helpers/status";

export class GiftCardRedemptionController {
    /**
     * Redeem multiple gift cards for a single user
     */
    static async redeemMultipleGiftCard(req: Request, res: Response) {
        const {
            trees_count: treesCount,
            sponsor_group: sponsorGroup,
            sponsor_user: sponsorUser,
            event_type: eventType,
            event_name: eventName,
            gifted_on: giftedOn,
            gifted_by: giftedBy,
            primaryMessage,
            secondaryMessage,
            logoMessage,
            user,
            profile_image_url: profileImageUrl,
            requesting_user: requestingUser,
        } = req.body;

        try {
            await GiftCardRedemptionService.redeemMultipleGiftCard({
                treesCount,
                sponsorGroup,
                sponsorUser,
                eventType,
                eventName,
                giftedOn,
                giftedBy,
                primaryMessage,
                secondaryMessage,
                logoMessage,
                user,
                profileImageUrl,
                requestingUser,
            });

            res.status(status.success).send();
        } catch (error: any) {
            console.log("[ERROR]", "GiftCardRedemptionController::redeemMultipleGiftCard", error);
            res.status(status.bad).send({ message: error.message || 'Something went wrong. Please try again later.' });
        }
    }

    /**
     * Bulk redeem gift cards for multiple users
     */
    static async bulkRedeemGiftCard(req: Request, res: Response) {
        const {
            sponsor_group: sponsorGroup,
            sponsor_user: sponsorUser,
            primaryMessage,
            secondaryMessage,
            logoMessage,
            requesting_user: requestingUser,
            users,
        } = req.body;

        try {
            await GiftCardRedemptionService.bulkRedeemGiftCard({
                sponsorGroup,
                sponsorUser,
                primaryMessage,
                secondaryMessage,
                logoMessage,
                requestingUser,
                users,
            });

            res.status(status.success).send({});
        } catch (error: any) {
            console.log("[ERROR]", "GiftCardRedemptionController::bulkRedeemGiftCard", error);
            res.status(status.bad).send({ message: error.message || 'Something went wrong. Please try again later.' });
        }
    }

    /**
     * Redeem a single gift card by ID
     */
    static async redeemGiftCard(req: Request, res: Response) {
        const {
            sponsor_group: sponsorGroup,
            sponsor_user: sponsorUser,
            requesting_user: requestingUser,
            gift_card_id: giftCardId,
            event_type: eventType,
            event_name: eventName,
            gifted_on: giftedOn,
            gifted_by: giftedBy,
            primaryMessage,
            secondaryMessage,
            logoMessage,
            user,
            profile_image_url: profileImageUrl
        } = req.body;

        try {
            await GiftCardRedemptionService.redeemGiftCard({
                sponsorGroup,
                sponsorUser,
                requestingUser,
                giftCardId,
                eventType,
                eventName,
                giftedOn,
                giftedBy,
                primaryMessage,
                secondaryMessage,
                logoMessage,
                user,
                profileImageUrl
            });

            res.status(status.success).send();
        } catch (error: any) {
            console.log("[ERROR]", "GiftCardRedemptionController::redeemGiftCard", error);
            res.status(status.bad).send({ message: error.message || 'Something went wrong. Please try again later.' });
        }
    }
}