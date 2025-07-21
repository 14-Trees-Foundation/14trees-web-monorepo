import { GiftCardRequest } from "../../models/gift_card_request";
import { GiftCardsRepository } from "../../repo/giftCardsRepo";
import { PaymentRepository } from "../../repo/paymentsRepo";
import { PaymentHistory } from "../../models/payment_history";
import { GiftCardUtils } from "../../controllers/helper/giftCard/utils";
import { GIFT_CARD_CONSTANTS } from "../../controllers/helper/giftCard/constants";

class GiftRequestService {
    
    public static async getGiftCardsRequest(giftCardRequestId: number): Promise<GiftCardRequest> {
        const resp = await GiftCardsRepository.getGiftCardRequests(0, 1, [
            { columnField: 'id', operatorValue: 'equals', value: giftCardRequestId }
        ]);

        return resp.results[0];
    }

    public static async getGiftRequestTags(offset: number = 0, limit: number = 100) {
        return await GiftCardsRepository.getGiftRequestTags(offset, limit);
    }

    public static async getGiftCardRequestsWithPaymentStatus(
        offset: number, 
        limit: number, 
        filters?: any[], 
        orderBy?: any[]
    ) {
        const giftCardRequests = await GiftCardsRepository.getGiftCardRequests(offset, limit, filters, orderBy);
        const data: any[] = [];

        for (const giftCardRequest of giftCardRequests.results) {
            let paidAmount = 0;
            let validatedAmount = 0;
            
            // Calculate total amount based on category and request type
            const totalAmount = GiftCardUtils.calculateTotalAmount(
                giftCardRequest.category,
                giftCardRequest.request_type || '',
                giftCardRequest.no_of_cards
            );

            // Calculate payment amounts if payment exists
            if (giftCardRequest.payment_id) {
                const payment: any = await PaymentRepository.getPayment(giftCardRequest.payment_id);
                if (payment && payment.payment_history) {
                    const paymentHistory: PaymentHistory[] = payment.payment_history;
                    const amounts = GiftCardUtils.calculateAmountsFromPaymentHistory(paymentHistory);
                    paidAmount = amounts.paidAmount;
                    validatedAmount = amounts.validatedAmount;
                }
            }

            // Calculate payment status
            const paymentStatus = GiftCardUtils.calculatePaymentStatus(
                validatedAmount,
                paidAmount,
                totalAmount,
                giftCardRequest.amount_received
            );

            data.push({
                ...giftCardRequest,
                plot_ids: GiftCardUtils.filterNullValues((giftCardRequest as any).plot_ids),
                presentation_ids: GiftCardUtils.filterNullValues((giftCardRequest as any).presentation_ids),
                payment_status: paymentStatus,
            });
        }

        giftCardRequests.results = data;
        return giftCardRequests;
    }

    public static async addGiftRequestToSpreadsheet(giftRequest: GiftCardRequest) {
        // TODO: This method will be implemented when we extract the spreadsheet integration logic
        // const { addGiftRequestToSpreadsheet } = await import('../giftCardsService');
        // return await addGiftRequestToSpreadsheet(giftRequest);
        console.log('addGiftRequestToSpreadsheet - TODO: Implement this function');
        return Promise.resolve();
    }

    private static calculateTotalAmount(category: string, requestType: string, noOfCards: number): number {
        return GiftCardUtils.calculateTotalAmount(category, requestType, noOfCards);
    }
}

export default GiftRequestService;