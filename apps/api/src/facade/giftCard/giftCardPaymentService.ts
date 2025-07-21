import { GiftCardsRepository } from "../../repo/giftCardsRepo";
import { PaymentRepository } from "../../repo/paymentsRepo";
import { PaymentHistory } from "../../models/payment_history";
import { SponsorshipType } from "../../models/gift_card_request";
import RazorpayService from "../../services/razorpay/razorpay";
import { GoogleSpreadsheet } from "../../services/google";
import { sendGiftRequestAcknowledgement } from "../../controllers/helper/giftRequestHelper";
import GiftCardsService from "../giftCardsService";

/**
 * Gift Card Payment Service
 * Handles payment processing and related operations for gift card requests
 */
export class GiftCardPaymentService {

    /**
     * Process payment success for a gift card request
     * Updates payment status, sends acknowledgment emails, and handles post-payment operations
     */
    async processPaymentSuccess(
        giftRequestId: number,
        remainingTrees: number = 0,
        isCorporate: boolean = false
    ): Promise<void> {
        console.log('[INFO] Processing payment success for gift request:', giftRequestId);

        const giftRequest = await GiftCardsService.getGiftCardsRequest(giftRequestId);

        let razorpayPaymentId = "";
        
        if (giftRequest.payment_id) {
            const paymentData = await this.processPaymentData(giftRequest.payment_id);
            razorpayPaymentId = paymentData.razorpayPaymentId;

            // Update gift request with payment information
            await GiftCardsRepository.updateGiftCardRequests({
                sponsorship_type: paymentData.sponsorshipType,
                donation_date: paymentData.donationDate,
                amount_received: paymentData.amountReceived,
            }, { id: giftRequest.id });
        }

        // Handle corporate requests differently
        if (isCorporate) {
            console.log('[INFO] Processing corporate gift request:', giftRequestId);
            // Corporate-specific logic is commented out in original
            // This would include auto-booking trees and fulfilling requests
            return;
        }

        // Send acknowledgment email for non-corporate requests
        await this.sendPaymentAcknowledgment(giftRequest, remainingTrees);

        // Update spreadsheet with payment information
        if (razorpayPaymentId) {
            await this.updatePaymentSpreadsheet(giftRequest.id, razorpayPaymentId);
        }

        // Handle referral notifications
        if (giftRequest.rfr_id) {
            await this.sendReferralNotification(giftRequest);
        }
    }

    /**
     * Process payment data from payment repository and Razorpay
     */
    private async processPaymentData(paymentId: number): Promise<{
        sponsorshipType: SponsorshipType;
        amountReceived: number;
        donationDate: Date | null;
        razorpayPaymentId: string;
    }> {
        let sponsorshipType: SponsorshipType = 'Unverified';
        let amountReceived: number = 0;
        let donationDate: Date | null = null;
        let razorpayPaymentId = "";

        // Get payment from repository
        const payment: any = await PaymentRepository.getPayment(paymentId);
        
        if (payment && payment.payment_history) {
            const paymentHistory: PaymentHistory[] = payment.payment_history;
            paymentHistory.forEach(payment => {
                if (payment.status !== 'payment_not_received') {
                    amountReceived += payment.amount;
                }
            });
        }

        // Get Razorpay payment information
        if (payment?.order_id) {
            const razorpayService = new RazorpayService();
            const payments = await razorpayService.getPayments(payment.order_id);

            payments?.forEach(item => {
                if (item.status === 'captured') {
                    amountReceived += Number(item.amount) / 100;
                    razorpayPaymentId = item.id;
                }
            });
        }

        // Update sponsorship type based on amount received
        if (amountReceived > 0) {
            sponsorshipType = 'Donation Received';
            donationDate = new Date();
        }

        return {
            sponsorshipType,
            amountReceived,
            donationDate,
            razorpayPaymentId
        };
    }

    /**
     * Send payment acknowledgment email to sponsor
     */
    private async sendPaymentAcknowledgment(giftRequest: any, remainingTrees: number): Promise<void> {
        const sponsorUser = {
            id: giftRequest.user_id,
            name: (giftRequest as any).user_name,
            email: (giftRequest as any).user_email,
        };

        try {
            await sendGiftRequestAcknowledgement(
                giftRequest,
                sponsorUser,
                remainingTrees,
            );
            console.log('[INFO] Payment acknowledgment email sent successfully');
        } catch (error) {
            console.error("[ERROR] Failed to send gift acknowledgment email:", {
                error,
                stack: error instanceof Error ? error.stack : undefined
            });
            throw error;
        }
    }

    /**
     * Update Google Spreadsheet with payment information
     */
    private async updatePaymentSpreadsheet(giftRequestId: number, razorpayPaymentId: string): Promise<void> {
        try {
            const sheetName = "Website-Gifting";
            const spreadsheetId = process.env.DONATION_SPREADSHEET;
            
            if (!spreadsheetId) {
                console.log("[WARN] Spreadsheet ID (DONATION_SPREADSHEET) is not present in env");
                return;
            }

            const googleSheet = new GoogleSpreadsheet();
            await googleSheet.updateRowCellsByColumnValue(
                spreadsheetId, 
                sheetName, 
                "Req Id", 
                giftRequestId.toString(), 
                { "Mode": razorpayPaymentId }
            );
            
            console.log('[INFO] Payment spreadsheet updated successfully');
        } catch (error) {
            console.error("[ERROR] Failed to update Google Sheet with transaction ID:", {
                error,
                stack: error instanceof Error ? error.stack : undefined
            });
            // Don't throw error as this is not critical
        }
    }

    /**
     * Send referral notification if applicable
     */
    private async sendReferralNotification(giftRequest: any): Promise<void> {
        try {
            await GiftCardsService.sendReferralGiftNotification(giftRequest);
            console.log('[INFO] Referral notification sent successfully');
        } catch (referralError) {
            console.error("[ERROR] Failed to send referral notification:", referralError);
            // Don't throw error as this is not critical
        }
    }
}

export default new GiftCardPaymentService();