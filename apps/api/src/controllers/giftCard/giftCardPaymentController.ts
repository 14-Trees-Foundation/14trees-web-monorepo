import { Request, Response } from "express";
import { status } from "../../helpers/status";
import { Logger } from "../../helpers/logger";
import GiftCardPaymentService from "../../facade/giftCard/giftCardPaymentService";

/**
 * Gift Card Payment Controller
 * Handles HTTP requests for gift card payment operations
 */

/**
 * Handle payment success for gift card request
 * POST /gift-card-requests/payment-success
 */
export const paymentSuccessForGiftRequest = async (req: Request, res: Response) => {
    const { gift_request_id, remaining_trees: remainingTrees, is_corporate } = req.body;

    try {
        console.log('[INFO] Processing payment success request:', {
            giftRequestId: gift_request_id,
            remainingTrees,
            isCorporate: is_corporate
        });

        await GiftCardPaymentService.processPaymentSuccess(
            gift_request_id,
            remainingTrees || 0,
            is_corporate || false
        );

        res.status(status.success).send();
        
        console.log('[INFO] Payment success processed successfully for gift request:', gift_request_id);

    } catch (error: any) {
        console.error("[ERROR] GiftCardPaymentController::paymentSuccessForGiftRequest", {
            error,
            stack: error instanceof Error ? error.stack : undefined,
            giftRequestId: gift_request_id
        });

        await Logger.logError('giftCardPaymentController', 'paymentSuccessForGiftRequest', error, req);
        
        res.status(status.error).send({ 
            message: "Failed to update payment status in system!" 
        });
    }
};