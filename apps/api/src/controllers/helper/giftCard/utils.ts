import { GIFT_CARD_CONSTANTS } from "./constants";
import { PaymentHistory } from "../../../models/payment_history";

export class GiftCardUtils {
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
    static calculatePaymentStatus(
        validatedAmount: number, 
        paidAmount: number, 
        totalAmount: number, 
        amountReceived: number
    ): string {
        if (validatedAmount === totalAmount || amountReceived === totalAmount) {
            return GIFT_CARD_CONSTANTS.PAYMENT_STATUS.FULLY_PAID;
        }
        
        if (validatedAmount < paidAmount) {
            return GIFT_CARD_CONSTANTS.PAYMENT_STATUS.PENDING_VALIDATION;
        }
        
        if (paidAmount === 0) {
            return GIFT_CARD_CONSTANTS.PAYMENT_STATUS.PENDING_PAYMENT;
        }
        
        return GIFT_CARD_CONSTANTS.PAYMENT_STATUS.PARTIALLY_PAID;
    }

    static calculateAmountsFromPaymentHistory(paymentHistory: PaymentHistory[]): {
        paidAmount: number;
        validatedAmount: number;
    } {
        let paidAmount = 0;
        let validatedAmount = 0;

        paymentHistory.forEach(payment => {
            if (payment.status !== 'payment_not_received') {
                paidAmount += payment.amount;
            }
            if (payment.status === 'validated') {
                validatedAmount += payment.amount;
            }
        });

        return { paidAmount, validatedAmount };
    }

    static generateDonationReceiptNumber(giftCardId: number): string {
        const date = new Date();
        const FY = date.getMonth() < 3 ? date.getFullYear() : date.getFullYear() + 1;
        return `${FY}/${giftCardId}`;
    }

    static filterNullValues<T>(array: (T | null)[]): T[] {
        return array.filter((item): item is T => item !== null);
    }

    static getVisitType(groupId?: number): string {
        return groupId ? GIFT_CARD_CONSTANTS.VISIT_TYPES.CORPORATE : GIFT_CARD_CONSTANTS.VISIT_TYPES.FAMILY;
    }

    static getDefaultEventName(eventName?: string): string {
        return eventName?.trim() ? eventName.trim() : `Visit on ${new Date().toDateString()}`;
    }

    static shouldAddToSpreadsheet(requestType?: string, tags?: string[]): boolean {
        return requestType === GIFT_CARD_CONSTANTS.REQUEST_TYPES.GIFT_CARDS && 
               tags?.includes(GIFT_CARD_CONSTANTS.SPREADSHEET_TAGS.WEBSITE) === true;
    }
}