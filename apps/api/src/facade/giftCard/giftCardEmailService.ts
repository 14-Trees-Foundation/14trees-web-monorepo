import { GiftCardsRepository } from "../../repo/giftCardsRepo";
import GiftCardsService from "../giftCardsService";
import { sendMailsToSponsors, sendMailsToReceivers, sendMailsToAssigneeReceivers } from "../../controllers/helper/giftRequestHelper";

/**
 * Gift Card Email Service
 * Handles email operations for gift card requests
 */
export class GiftCardEmailService {

    /**
     * Send emails for gift card request
     * Handles sponsor, receiver, and assignee email sending based on configuration
     */
    async sendEmailsForGiftCardRequest(
        giftCardRequestId: number,
        options: {
            testMails?: string[];
            receiverCC?: string[];
            sponsorCC?: string[];
            attachCard?: boolean;
            eventType?: string;
            emailSponsor?: boolean;
            emailReceiver?: boolean;
            emailAssignee?: boolean;
        }
    ): Promise<void> {
        console.log('[INFO] Processing email request for gift card:', giftCardRequestId);

        const {
            testMails,
            receiverCC,
            sponsorCC,
            attachCard = false,
            eventType = 'default',
            emailSponsor = false,
            emailReceiver = false,
            emailAssignee = false
        } = options;

        // Get gift card request details
        const resp = await GiftCardsRepository.getGiftCardRequests(0, 1, [
            { columnField: 'id', operatorValue: 'equals', value: giftCardRequestId }
        ]);

        if (resp.results.length !== 1) {
            throw new Error('Gift card request not found');
        }

        const giftCardRequest: any = resp.results[0];
        
        // Check mail sent status
        const { sponsorMailSent, allRecipientsMailed, allAssigneesMailed } = 
            await GiftCardsService.getMailSentStatus(giftCardRequestId);
        
        // Get gift card details
        const giftCards: any[] = await GiftCardsRepository.getGiftCardUserAndTreeDetails(giftCardRequestId);

        // Validate email sending conditions
        if (emailSponsor && sponsorMailSent) {
            throw new Error('Sponsor mail already sent.');
        }

        if (emailReceiver && allRecipientsMailed) {
            throw new Error('Recipient mail already sent.');
        }

        if (emailAssignee && allAssigneesMailed) {
            throw new Error('Assignee mail already sent.');
        }

        // Send emails based on configuration
        const emailPromises: Promise<void>[] = [];

        if (emailSponsor && !sponsorMailSent) {
            console.log('[INFO] Sending sponsor emails');
            emailPromises.push(
                sendMailsToSponsors(giftCardRequest, giftCards, eventType, attachCard, sponsorCC, testMails)
            );
        }

        if (emailReceiver && !allRecipientsMailed) {
            console.log('[INFO] Sending receiver emails');
            emailPromises.push(
                sendMailsToReceivers(giftCardRequest, giftCards, eventType, attachCard, receiverCC, testMails)
            );
        }

        if (emailAssignee && !allAssigneesMailed) {
            console.log('[INFO] Sending assignee emails');
            emailPromises.push(
                sendMailsToAssigneeReceivers(giftCardRequest, giftCards, eventType, attachCard, receiverCC, testMails)
            );
        }

        // Execute all email sending operations
        if (emailPromises.length > 0) {
            await Promise.all(emailPromises);
            console.log('[INFO] All emails sent successfully');
        } else {
            console.log('[INFO] No emails to send based on current configuration');
        }
    }

    /**
     * Send custom email to sponsor
     * Sends a custom email with specified template and attachments
     */
    async sendCustomEmailToSponsor(
        giftRequestId: number,
        templateName: string,
        options: {
            testEmails?: string[];
            attachments?: any[];
            attachCards?: boolean;
            subject?: string;
        } = {}
    ): Promise<void> {
        console.log('[INFO] Sending custom email for gift request:', giftRequestId);

        const {
            testEmails,
            attachments,
            attachCards = false,
            subject
        } = options;

        // Get gift card request details
        const resp = await GiftCardsRepository.getGiftCardRequests(0, 1, [
            { columnField: 'id', operatorValue: 'equals', value: giftRequestId }
        ]);

        if (resp.results.length !== 1) {
            throw new Error('Gift card request not found');
        }

        const giftCardRequest: any = resp.results[0];
        const giftCards: any[] = await GiftCardsRepository.getGiftCardUserAndTreeDetails(giftCardRequest.id);

        // Send custom email using the service
        await GiftCardsService.sendCustomEmailToSponsor(
            giftCardRequest,
            giftCards,
            templateName,
            attachCards,
            undefined, // ccMails
            testEmails,
            subject,
            attachments
        );

        console.log('[INFO] Custom email sent successfully');
    }

    /**
     * Get email sending status for a gift card request
     */
    async getEmailStatus(giftCardRequestId: number): Promise<{
        sponsorMailSent: boolean;
        allRecipientsMailed: boolean;
        allAssigneesMailed: boolean;
    }> {
        return await GiftCardsService.getMailSentStatus(giftCardRequestId);
    }

    /**
     * Send emails to sponsors only
     */
    async sendSponsorEmails(
        giftCardRequestId: number,
        eventType: string = 'default',
        attachCard: boolean = false,
        ccMails?: string[],
        testMails?: string[]
    ): Promise<void> {
        const giftCardRequest = await this.getGiftCardRequest(giftCardRequestId);
        const giftCards = await GiftCardsRepository.getGiftCardUserAndTreeDetails(giftCardRequestId);
        
        await sendMailsToSponsors(giftCardRequest, giftCards, eventType, attachCard, ccMails, testMails);
    }

    /**
     * Send emails to receivers only
     */
    async sendReceiverEmails(
        giftCardRequestId: number,
        eventType: string = 'default',
        attachCard: boolean = false,
        ccMails?: string[],
        testMails?: string[]
    ): Promise<void> {
        const giftCardRequest = await this.getGiftCardRequest(giftCardRequestId);
        const giftCards = await GiftCardsRepository.getGiftCardUserAndTreeDetails(giftCardRequestId);
        
        await sendMailsToReceivers(giftCardRequest, giftCards, eventType, attachCard, ccMails, testMails);
    }

    /**
     * Send emails to assignees only
     */
    async sendAssigneeEmails(
        giftCardRequestId: number,
        eventType: string = 'default',
        attachCard: boolean = false,
        ccMails?: string[],
        testMails?: string[]
    ): Promise<void> {
        const giftCardRequest = await this.getGiftCardRequest(giftCardRequestId);
        const giftCards = await GiftCardsRepository.getGiftCardUserAndTreeDetails(giftCardRequestId);
        
        await sendMailsToAssigneeReceivers(giftCardRequest, giftCards, eventType, attachCard, ccMails, testMails);
    }

    /**
     * Helper method to get gift card request
     */
    private async getGiftCardRequest(giftCardRequestId: number): Promise<any> {
        const resp = await GiftCardsRepository.getGiftCardRequests(0, 1, [
            { columnField: 'id', operatorValue: 'equals', value: giftCardRequestId }
        ]);

        if (resp.results.length !== 1) {
            throw new Error('Gift card request not found');
        }

        return resp.results[0];
    }
}

export default new GiftCardEmailService();