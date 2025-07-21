import { CreateGiftCardRequestBody, PaymentSuccessBody, BookTreesBody, UpsertUsersBody } from "./types";
import { GIFT_CARD_CONSTANTS } from "./constants";
import { GiftCardRequestValidationError } from "../../../models/gift_card_request";

export class GiftCardValidation {
    static validateCreateGiftCardRequest(body: CreateGiftCardRequestBody): { isValid: boolean; errors: string[] } {
        const errors: string[] = [];

        if (!body.user_id) {
            errors.push("User ID is required");
        }

        if (!body.no_of_cards || body.no_of_cards <= 0) {
            errors.push("Number of cards must be greater than 0");
        }

        if (!body.request_id) {
            errors.push("Request ID is required");
        }

        if (body.request_type === GIFT_CARD_CONSTANTS.REQUEST_TYPES.GIFT_CARDS && !body.sponsor_id) {
            errors.push("Sponsor is required for gift card requests");
        }

        return {
            isValid: errors.length === 0,
            errors
        };
    }

    static validatePaymentSuccess(body: PaymentSuccessBody): { isValid: boolean; errors: string[] } {
        const errors: string[] = [];

        if (!body.gift_request_id) {
            errors.push("Gift request ID is required");
        }

        return {
            isValid: errors.length === 0,
            errors
        };
    }

    static validateBookTrees(body: BookTreesBody): { isValid: boolean; errors: string[] } {
        const errors: string[] = [];

        if (!body.gift_card_request_id) {
            errors.push("Gift card request ID is required");
        }

        if (!body.gift_card_trees || !Array.isArray(body.gift_card_trees)) {
            errors.push("Gift card trees must be an array");
        }

        return {
            isValid: errors.length === 0,
            errors
        };
    }

    static validateUpsertUsers(body: UpsertUsersBody): { isValid: boolean; errors: string[] } {
        const errors: string[] = [];

        if (!body.gift_card_request_id) {
            errors.push("Gift card request ID is required");
        }

        if (!body.users || !Array.isArray(body.users)) {
            errors.push("Users must be an array");
        }

        return {
            isValid: errors.length === 0,
            errors
        };
    }

    static calculateTotalAmount(category: string, requestType: string, noOfCards: number): number {
        let unitPrice: number;

        if (category === GIFT_CARD_CONSTANTS.CATEGORIES.PUBLIC) {
            if (requestType === GIFT_CARD_CONSTANTS.REQUEST_TYPES.NORMAL_ASSIGNMENT || 
                requestType === GIFT_CARD_CONSTANTS.REQUEST_TYPES.VISIT) {
                unitPrice = GIFT_CARD_CONSTANTS.PRICING.PUBLIC_NORMAL;
            } else {
                unitPrice = GIFT_CARD_CONSTANTS.PRICING.PUBLIC_GIFT_CARDS;
            }
        } else {
            unitPrice = GIFT_CARD_CONSTANTS.PRICING.PRIVATE;
        }

        return unitPrice * noOfCards;
    }

    static getValidationErrors(groupId?: number): GiftCardRequestValidationError[] {
        const errors: GiftCardRequestValidationError[] = [GIFT_CARD_CONSTANTS.VALIDATION_ERRORS.MISSING_USER_DETAILS];
        
        if (groupId) {
            errors.unshift(GIFT_CARD_CONSTANTS.VALIDATION_ERRORS.MISSING_LOGO);
        }
        
        return errors;
    }
}