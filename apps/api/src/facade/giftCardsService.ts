import moment from "moment";
import { bulkUpdateSlides, createCopyOfTheCardTemplates, deleteUnwantedSlides, reorderSlides } from "../controllers/helper/slides";
import { GiftCardRequest, GiftCardRequestStatus, GiftReqMailStatus_Accounts, GiftReqMailStatus_BackOffice, GiftReqMailStatus_CSR, GiftReqMailStatus_Volunteer } from "../models/gift_card_request";
import PlantTypeTemplateRepository from "../repo/plantTypeTemplateRepo";
import TreeRepository from "../repo/treeRepo";
import { copyFile, GoogleSpreadsheet } from "../services/google";
import { formatNumber, numberToWords } from "../helpers/utils";
import { PaymentRepository } from "../repo/paymentsRepo";
import { sendDashboardMail } from "../services/gmail/gmail";
import { GiftCardsRepository } from "../repo/giftCardsRepo";
import { User } from "../models/user";
import { AutoPrsReqPlotsRepository } from "../repo/autoPrsReqPlotRepo";
import { PlotRepository } from "../repo/plotRepo";
import { UserRepository } from "../repo/userRepo";
import { ReferralsRepository } from "../repo/referralsRepo";
import { GiftRequestUser, GiftRequestUserAttributes, GiftRequestUserCreationAttributes } from "../models/gift_request_user";
import { UserRelationRepository } from "../repo/userRelationsRepo";
import { GiftCard } from "../models/gift_card";
import { Op } from "sequelize";
import { GroupRepository }  from "../repo/groupRepo"
import { UserGroupRepository } from "../repo/userGroupRepo";
import { GRTransactionsRepository } from "../repo/giftRedeemTransactionsRepo";
import { GiftRedeemTransactionCreationAttributes, GRTCard } from "../models/gift_redeem_transaction";
import { generateFundRequestPdf } from "../services/invoice/generatePdf";
import { uploadBase64DataToS3 } from "../controllers/helper/uploadtos3";
import { defaultGiftMessages } from "../controllers/helper/giftRequestHelper";

const defaultMessage = "Dear {recipient},\n\n"
    + 'We are immensely delighted to share that a tree has been planted in your name at the 14 Trees Foundation, Pune. This tree will be nurtured in your honour, rejuvenating ecosystems, supporting biodiversity, and helping offset the harmful effects of climate change.'
    + "\n\n"
    + 'We invite you to visit 14 Trees and firsthand experience the growth and contribution of your tree towards a greener future.'


class GiftCardsService {

    public static async getGiftCardsRequest(giftCardRequestId: number): Promise<GiftCardRequest> {
        const resp = await GiftCardsRepository.getGiftCardRequests(0, 1, [
            { columnField: 'id', operatorValue: 'equals', value: giftCardRequestId }
        ])

        return resp.results[0];
    }

    private static async upsertGiftRequestUsersAndRelations(users: any[], giftCardRequestId: number) {
        const addUsersData: GiftRequestUserCreationAttributes[] = []
        const updateUsersData: GiftRequestUserAttributes[] = []
        let count = 0;
        for (const user of users) {

            // gifted To
            const recipientUser = {
                id: user.recipient,
                name: user.recipient_name,
                email: user.recipient_email,
                communication_email: user.recipient_communication_email,
                phone: user.recipient_phone,
            }
            const recipient = await UserRepository.upsertUserByEmailAndName(recipientUser);

            // assigned To
            const assigneeUser = {
                id: user.assignee,
                name: user.assignee_name,
                email: user.assignee_email,
                communication_email: user.assignee_communication_email,
                phone: user.assignee_phone,
            }
            const assignee = await UserRepository.upsertUserByEmailAndName(assigneeUser);

            if (recipient.id !== assignee.id && user.relation?.trim()) {
                await UserRelationRepository.createUserRelation({
                    primary_user: recipient.id,
                    secondary_user: assignee.id,
                    relation: user.relation.trim(),
                    created_at: new Date(),
                    updated_at: new Date(),
                })
            }

            if (user.id) {
                updateUsersData.push({
                    ...user,
                    gift_request_id: giftCardRequestId,
                    recipient: recipient.id,
                    assignee: assignee.id,
                    profile_image_url: user.image_url || null,
                    updated_at: new Date(),
                })
            } else {
                addUsersData.push({
                    ...user,
                    gift_request_id: giftCardRequestId,
                    recipient: recipient.id,
                    assignee: assignee.id,
                    profile_image_url: user.image_url || null,
                    gifted_by: user.gifted_by || null,
                    gifted_on: user.gifted_on || null,
                    event_name: user.event_name || null,
                    created_at: new Date(),
                    updated_at: new Date(),
                })
            }

            count += parseInt(user.gifted_trees) || 1;
        }

        return { addUsersData, updateUsersData, count };
    }

    private static async deleteGiftRequestUsersAndResetTrees(deleteIds: number[], giftCards: GiftCard[], giftCardRequestId: number) {
        const treeIds = giftCards.filter(item => item.gift_request_user_id && item.tree_id && deleteIds.includes(item.gift_request_user_id)).map(item => item.tree_id);
        await TreeRepository.updateTrees({
            description: null,
            assigned_to: null,
            assigned_at: null,
            gifted_to: null,
            gifted_by: null,
            planted_by: null,
            gifted_by_name: null,
            event_type: null,
            user_tree_image: null,
            memory_images: null,
            updated_at: new Date()
        }, { id: { [Op.in]: treeIds } });

        await GiftCardsRepository.updateGiftCards({ gift_request_user_id: null }, { gift_card_request_id: giftCardRequestId, gift_request_user_id: { [Op.in]: deleteIds } });
        await GiftCardsRepository.deleteGiftRequestUsers({ id: { [Op.in]: deleteIds } });
    }

    public static async upsertGiftRequestUsers(giftCardRequest: GiftCardRequest, users: any[]) {
        const cardsResp = await GiftCardsRepository.getBookedTrees(0, -1, [{ columnField: 'gift_card_request_id', operatorValue: 'equals', value: giftCardRequest.id }]);
        const giftCards = cardsResp.results;

        const { addUsersData, updateUsersData, count } = await this.upsertGiftRequestUsersAndRelations(users, giftCardRequest.id);

        if (count > giftCardRequest.no_of_cards)
            throw new Error("Requested number of gift trees doesn't match in user details!");

        const existingUsers = await GiftCardsRepository.getGiftRequestUsers(giftCardRequest.id);
        const deleteIds = existingUsers.filter(item => users.findIndex((user: any) => user.id === item.id) === -1).map(item => item.id);
        if (deleteIds.length > 0) {
            await this.deleteGiftRequestUsersAndResetTrees(deleteIds, giftCards, giftCardRequest.id);
        }

        if (addUsersData.length > 0) await GiftCardsRepository.addGiftRequestUsers(addUsersData);
        for (const user of updateUsersData) {

            const treeIds = giftCards.filter(item => item.tree_id && item.gift_request_user_id === user.id).map(item => item.tree_id);
            await TreeRepository.updateTrees({
                assigned_to: user.assignee,
                assigned_at: user.gifted_on || giftCardRequest.gifted_on,
                description: user.event_name || giftCardRequest.event_name || null,
                gifted_by_name: user.gifted_by || giftCardRequest.planted_by || null,
                gifted_to: giftCardRequest.request_type === 'Normal Assignment' ? null : user.recipient,
                user_tree_image: user.profile_image_url,
                updated_at: new Date()
            }, { id: { [Op.in]: treeIds } });

            await GiftCardsRepository.updateGiftRequestUsers(user, { id: user.id });
        }

        // add recipients to Giftee group
        let recipientIds: number[] = []
        addUsersData.forEach(item => { if (item.recipient) recipientIds.push(item.recipient) });
        updateUsersData.forEach(item => { if (item.recipient) recipientIds.push(item.recipient) });
        await UserGroupRepository.addUsersToGifteeGroup(recipientIds);

        // validation on user details
        if (giftCardRequest.no_of_cards !== count && !giftCardRequest.validation_errors?.includes('MISSING_USER_DETAILS')) {
            giftCardRequest.validation_errors = giftCardRequest.validation_errors ? [...giftCardRequest.validation_errors, 'MISSING_USER_DETAILS'] : ['MISSING_USER_DETAILS']
        } else if (giftCardRequest.no_of_cards === count && giftCardRequest.validation_errors?.includes('MISSING_USER_DETAILS')) {
            giftCardRequest.validation_errors = giftCardRequest.validation_errors ? giftCardRequest.validation_errors.filter(error => error !== 'MISSING_USER_DETAILS') : [];
        }

        if (!giftCardRequest.validation_errors || giftCardRequest.validation_errors.length === 0) giftCardRequest.validation_errors = [];
        giftCardRequest.updated_at = new Date();
        const updated = await GiftCardsRepository.updateGiftCardRequest(giftCardRequest);

        return updated;
    }

    public static async generateTreeCardsForSaplings(saplingIds: string[]) {

        const treesResp = await TreeRepository.getTrees(0, -1, [
            { columnField: 'sapling_id', operatorValue: 'isAnyOf', value: saplingIds }
        ]);

        const data = treesResp.results.map((tree: any) => {
            return {
                saplingId: tree.sapling_id,
                plantType: tree.plant_type,
                assignedTo: tree.assigned_to_name,
            }
        })

        if (!process.env.GIFT_CARD_PRESENTATION_ID) {
            throw new Error("Missing gift card template presentation id in ENV variables.");
        }

        const templatePresentationId: string = process.env.GIFT_CARD_PRESENTATION_ID;
        const presentationId = await copyFile(templatePresentationId, `Adhoc Gift Cards - ${new Date().toDateString()}`);

        const plantTypeTemplateIdMap: Map<string, string> = new Map();
        const plantTypeTemplates = await PlantTypeTemplateRepository.getAll();
        for (const plantTypeTemplate of plantTypeTemplates) {
            plantTypeTemplateIdMap.set(plantTypeTemplate.plant_type, plantTypeTemplate.template_id);
        }

        const templateIds: string[] = [];
        const trees: typeof data = []
        for (const tree of data) {
            const templateId = plantTypeTemplateIdMap.get(tree.plantType);
            if (!templateId) continue;

            templateIds.push(templateId);
            trees.push(tree);
        }

        const records: any[] = [];
        const slideIds: string[] = await createCopyOfTheCardTemplates(presentationId, templateIds);
        for (let i = 0; i < slideIds.length; i++) {
            const templateId = slideIds[i];
            const tree = trees[i];

            let primaryMessage = defaultMessage;
            primaryMessage = primaryMessage.replace("{recipient}", tree.assignedTo || "");
            const record = {
                slideId: templateId,
                sapling: tree.saplingId,
                message: primaryMessage,
                logo: null,
                logo_message: ""
            }

            records.push(record);
        }

        await bulkUpdateSlides(presentationId, records);
        await deleteUnwantedSlides(presentationId, slideIds);
        await reorderSlides(presentationId, slideIds);

        return presentationId;
    }

    public static async getMailSentStatus(giftCardRequestId: number): Promise<{ sponsorMailSent: boolean, allRecipientsMailed: boolean, allAssigneesMailed: boolean, hasRecipients: boolean }> {
        try {
            const response = await GiftCardsRepository.getGiftCardRequests(0, 1, [
                { columnField: "id", operatorValue: "equals", value: giftCardRequestId }
            ]);
    
            if (response.results.length !== 1) {
                throw new Error("Gift card request not found");
            }
    
            const request = response.results[0];

            const users = await GiftCardsRepository.getGiftRequestUsers(giftCardRequestId);
            const hasRecipients = users.length > 0;
    
            let allRecipientsMailed = true;
            let allAssigneesMailed = true;
    
            users.forEach(user => {
                const isSame = user.recipient === user.assignee;
                if (!user.mail_sent) {
                    allRecipientsMailed = false;
                }
                if (isSame) {
                    if (!user.mail_sent) {
                        allAssigneesMailed = false;
                    }
                } else {
                    if (!user.mail_sent_assignee) {
                        allAssigneesMailed = false;
                    }
                }
            });                     
    
            return {
                sponsorMailSent: request.mail_sent || false,
                allRecipientsMailed,
                allAssigneesMailed,
                hasRecipients,
            };
    
        } catch (error) {
            console.error("[ERROR] GiftCardService::getMailSentStatus", error);
            throw new Error("Failed to check email statuses");
        }
    }

    /**
     * Generates a fund request PDF for a gift card request and uploads it to S3
     * 
     * @param giftCardRequestId - The ID of the gift card request
     * @returns Object containing the gift card request, group, PDF URL, and other details
     * @throws Error if the gift card request or group is not found, or if the request is not for a corporate
     */
    public static async generateFundRequestPdf(giftCardRequestId: number): Promise<{
        giftCardRequest: GiftCardRequest,
        group: any,
        filename: string,
        pdfUrl: { location: string },
        totalAmount: number,
        perTreeCost: number
    }> {
        // Get the gift card request
        const resp = await GiftCardsRepository.getGiftCardRequests(0, 1, [
            { columnField: 'id', operatorValue: 'equals', value: giftCardRequestId }
        ]);
        
        if (resp.results.length !== 1) {
            throw new Error('Gift card request not found');
        }

        const giftCardRequest = resp.results[0];
        
        // Validate it's a corporate request
        if (!giftCardRequest.group_id) {
            throw new Error('Fund request can be generated only for corporate requests');
        }

        // Get the group
        const group = await GroupRepository.getGroup(giftCardRequest.group_id);
        if (!group) {
            throw new Error('Group not found');
        }

        // Calculate the cost per tree based on request type and category
        const perTreeCost =
            giftCardRequest.category === 'Public'
                ? giftCardRequest.request_type === 'Normal Assignment' || giftCardRequest.request_type === 'Visit'
                    ? 1500
                    : 2000
                : 3000;

        // Generate the filename
        const filename = `${group.name} [Req. No: ${giftCardRequest.id}] ${new Date().toDateString()}.pdf`;
        
        // Calculate the total amount
        const totalAmount = giftCardRequest.no_of_cards * perTreeCost;
        
        // Prepare data for the PDF
        const data = {
            address: group.address?.split('\n').join('<br/>'),
            date: moment(new Date()).format('MMMM DD, YYYY'),
            no_of_trees: giftCardRequest.no_of_cards,
            per_tree_cost: perTreeCost,
            total_amount: formatNumber(totalAmount),
            total_amount_words: "Rupees " + numberToWords(totalAmount)
                .split(' ')
                .map((word: string) => word.charAt(0).toUpperCase() + word.slice(1))
                .join(' ') + " only",
        };

        // Generate the PDF and upload to S3
        const base64Data = await generateFundRequestPdf(data);
        const pdfUrl = await uploadBase64DataToS3(
            filename, 
            'gift_cards', 
            base64Data, 
            { 'Content-Type': 'application/pdf' }, 
            giftCardRequest.request_id
        );

        return {
            giftCardRequest,
            group,
            filename,
            pdfUrl,
            totalAmount,
            perTreeCost
        };
    }

    /**
     * Sends a fund request email with the PDF attachment to the corporate billing email
     * 
     * @param giftCardRequestId - The ID of the gift card request
     * @returns Object containing the status of the email sending and the PDF URL
     * @throws Error if the gift card request or group is not found, or if the request is not for a corporate
     */
    public static async sendFundRequestEmail(giftCardRequestId: number): Promise<{
        message: string,
        pdfUrl: { location: string }
    }> {
        // Generate the fund request PDF
        const { 
            giftCardRequest, 
            group, 
            filename, 
            pdfUrl, 
            totalAmount 
        } = await this.generateFundRequestPdf(giftCardRequestId);

        // Validate billing email exists
        if (!group.billing_email) {
            throw new Error('Billing email not found for the corporate');
        }

        // Get creator information
        let requestCreatedBy = (giftCardRequest as any).user_name || "14 Trees Team";

        // Prepare email data
        const emailData = {
            corporateName: group.name,
            requestNumber: giftCardRequest.id.toString(),
            treesCount: giftCardRequest.no_of_cards.toString(),
            amount: formatNumber(totalAmount),
            date: moment(new Date()).format('MMMM DD, YYYY'),
            requestCreatedBy: requestCreatedBy
        };

        // Prepare email recipients
        const toEmails = [group.billing_email];
        
        // Add attachments
        const attachments = [
            { 
                filename: filename, 
                path: pdfUrl.location
            }
        ];

        // Send email
        const emailSubject = `Fund Request - ${group.name} - ${giftCardRequest.no_of_cards} Trees`;
        const statusMessage = await sendDashboardMail(
            "corporate_fund_request.html",
            emailData,
            toEmails,
            undefined,
            attachments,
            emailSubject
        );

        if (statusMessage) {
            console.log("[WARNING]", "GiftCardsService::sendFundRequestEmail", "Email sending issue:", statusMessage);
        }

        return {
            message: 'Fund request sent successfully!',
            pdfUrl
        };
    }

    public static async addGiftRequestToSpreadsheet(giftRequest: GiftCardRequest) {
        const sheet = new GoogleSpreadsheet();

        const sheetName = "Website-Gifting"
        const spreadsheetId = process.env.DONATION_SPREADSHEET;
        if (!spreadsheetId) {
            console.log("[WARN]", "GiftCardsService::addGiftRequestToSpreadsheet", "spreadsheet id (DONATION_SPREADSHEET) is not present in env");
            return;
        }

        const headerRes = await sheet.getSpreadsheetData(spreadsheetId, `${sheetName}!1:1`);
        const headers: string[] = headerRes?.data?.values?.[0] || [];

        const totalAmount =
            (giftRequest.category === 'Public'
                ? 2000
                : 3000
            ) * giftRequest.no_of_cards;

        let panNumber = "";
        if (giftRequest.payment_id) {
            const payment = await PaymentRepository.getPayment(giftRequest.payment_id);
            if (payment?.pan_number) panNumber = payment.pan_number;
        }

        const data: any = {
            "Req Id": giftRequest.id,
            Date: moment(giftRequest.created_at).format("DD/MM/YYYY"),
            Name: (giftRequest as any).user_name,
            Email: (giftRequest as any).user_email,
            Phone: (giftRequest as any).user_phone,
            Trees: giftRequest.no_of_cards,
            "Gifted By": giftRequest.planted_by,
            "Event Name": giftRequest.event_name,
            "Total Amt": formatNumber(totalAmount),
            PAN: panNumber,
            Amount: formatNumber(totalAmount),
            AmountW: numberToWords(totalAmount),
        }

        const row = headers.map((header: string) => data[header] || '');
        await sheet.insertRowData(spreadsheetId, sheetName, row);
    }

    public static async sendGiftingNotificationToBackOffice(
        giftCardRequestId: number,
        sponsorUser: User,
        testMails?: string[],
    ): Promise<void> {
        try {
            const giftCardRequest = await GiftCardsRepository.getGiftCardRequests(0, 1, [
                { columnField: "id", operatorValue: "equals", value: giftCardRequestId }
            ]);
            const giftCard = giftCardRequest.results[0];
    
            const isCorporate = giftCard.tags?.includes('Corporate');
            const amount = (giftCard.category === 'Public' ? 2000 : 3000) * giftCard.no_of_cards;
            const recipients = await GiftCardsRepository.getGiftRequestUsers(giftCard.id);
    
            let corporateName: string | undefined = undefined;
            if (isCorporate && giftCard.group_id) {
                try {
                    const group = await GroupRepository.getGroup(giftCard.group_id);
                     console.log(group?.name); 
                    corporateName = group?.name || 'Unknown Corporation';
                } catch (groupErr) {
                    console.warn("[WARN] Failed to fetch corporate name for group_id:", giftCard.group_id, groupErr);
                    corporateName = 'Unknown Corporation';
                }
            }
            let panNumber = "";
            if (giftCard.payment_id) {
                const payment: any = await PaymentRepository.getPayment(giftCard.payment_id);
                panNumber = payment?.pan_number || "";
            }
    
            const emailData = {
                giftCardRequestId: giftCard.id,
                sponsorName: sponsorUser.name,
                sponsorEmail: sponsorUser.email,
                sponsorPhone: sponsorUser.phone,
                giftCardAmount: formatNumber(amount),
                totalTrees: giftCard.no_of_cards,
                eventName: giftCard.event_name,
                giftCardDate: moment(new Date(giftCard.created_at)).format('MMMM DD, YYYY'),
                panNumber: panNumber || "N/A",
                recipients: recipients.map((user: any) => ({
                    name: user.recipient_name,
                    email: user.recipient_email,
                    phone: user.recipient_phone,
                    trees: user.gifted_trees || 1,
                })),
                ...(isCorporate && { 
                    corporateName: corporateName || 'Unknown Corporation',
                    tags: giftCard.tags?.join(', ') || 'No tags',
                    tagsArray: giftCard.tags || []
                })
            };
    
            const mailIds = (testMails && testMails.length !== 0)
                ? testMails
                : ['dashboard@14trees.org'];
    
            const templateName = isCorporate ? 'backoffice_corpGifting.html' : 'backoffice_gifting.html';
    
            const statusMessage = await sendDashboardMail(
                templateName,
                emailData,
                mailIds,
                undefined,
                [],
                isCorporate ? 'New Corporate Gift Card Request' : 'New Gift Card Request'
            );
    
            if (statusMessage) {
                await GiftCardsRepository.updateGiftCardRequests({
                    mail_error: "BackOffice: " + statusMessage,
                }, { id: giftCard.id });
                return;
            }
    
            await GiftCardsRepository.updateGiftCardRequests({
                mail_status: giftCard.mail_status
                    ? [...giftCard.mail_status, GiftReqMailStatus_BackOffice]
                    : [GiftReqMailStatus_BackOffice],
            }, { id: giftCard.id });
    
        } catch (error) {
            const errorMessage = error instanceof Error
                ? `Failed to send gifting notification: ${error.message}`
                : 'Failed to send gifting notification due to an unknown error';
            await GiftCardsRepository.updateGiftCardRequests({
                mail_error: "BackOffice: " + errorMessage,
            }, { id: giftCardRequestId });
        }
    }
    
    public static async sendGiftingNotificationToAccounts(
        giftCardRequestId: number,
        sponsorUser: User,
        testMails?: string[],
    ): Promise<void> {
        try {
            const giftCardRequest = await GiftCardsRepository.getGiftCardRequests(0, 1, [{ columnField: "id", operatorValue: "equals", value: giftCardRequestId }])
            const giftCard = giftCardRequest.results[0];
            const isCorporate = giftCard.tags?.includes('Corporate');
    
            const amount = (giftCard.category === 'Public' ? 2000 : 3000) * giftCard.no_of_cards;
            const recipients = await GiftCardsRepository.getGiftRequestUsers(giftCard.id);

            let corporateName: string | undefined = undefined;
            if (isCorporate && giftCard.group_id) {
                try {
                    const group = await GroupRepository.getGroup(giftCard.group_id);
                    corporateName = group?.name || 'Unknown Corporation';
                } catch (groupErr) {
                    console.warn("[WARN] Failed to fetch corporate name for group_id:", giftCard.group_id, groupErr);
                    corporateName = 'Unknown Corporation';
                }
            }
            let panNumber = "";
            if (giftCard.payment_id) {
                const payment: any = await PaymentRepository.getPayment(giftCard.payment_id);
                panNumber = payment?.pan_number || "";
            }
    
            const emailData = {
                giftCardRequestId: giftCard.id,
                sponsorName: sponsorUser.name,
                sponsorEmail: sponsorUser.email,
                sponsorPhone: sponsorUser.phone,
                giftCardAmount: formatNumber(amount),
                totalTrees: giftCard.no_of_cards,
                eventName: giftCard.event_name,
                giftCardDate: moment(new Date(giftCard.created_at)).format('MMMM DD, YYYY'),
                panNumber: panNumber || "N/A",
                recipients: recipients.map((user: any) => ({
                    name: user.recipient_name,
                    email: user.recipient_email,
                    phone: user.recipient_phone,
                    trees: user.gifted_trees || 1,
                })),
                ...(isCorporate && { 
                    corporateName: corporateName || 'Unknown Corporation',
                    tags: giftCard.tags?.join(', ') || 'No tags',
                    tagsArray: giftCard.tags || []
                })
            };
    
            const mailIds = (testMails && testMails.length !== 0) ?
            testMails :
            ['accounts@14trees.org', 'accounts2@14trees.org'];
            const templateName = isCorporate ? 'gifting-corpAccounts.html' : 'gifting-accounts.html';
    
            const statusMessage = await sendDashboardMail(
                templateName,
                emailData,
                mailIds,
                undefined,
                [],
                isCorporate ? 'New Corporate Gift Card Request' : 'New Gift Card Request'
            );
    
            if (statusMessage) {
                await GiftCardsRepository.updateGiftCardRequests({
                    mail_error: "Accounts: " + statusMessage,
                }, { id: giftCard.id });
                return;
            }
    
            await GiftCardsRepository.updateGiftCardRequests({
                mail_status: giftCard.mail_status ? [...giftCard.mail_status, GiftReqMailStatus_Accounts] : [GiftReqMailStatus_Accounts],
            }, { id: giftCard.id });
        } catch (error) {
            const errorMessage = error instanceof Error ?
            `Failed to send gifting notification: ${error.message}` :
            'Failed to send gifting notification due to an unknown error';            
            await GiftCardsRepository.updateGiftCardRequests({
                mail_error: "Accounts: " + errorMessage,
            }, { id: giftCardRequestId });
        }
    }
    
    public static async sendGiftingNotificationForVolunteers(
        giftCardRequestId: number,
        sponsorUser: User,
        testMails?: string[],
    ): Promise<void> {
        try {
            const giftCardRequest = await GiftCardsRepository.getGiftCardRequests(0, 1, [{ columnField: "id", operatorValue: "equals", value: giftCardRequestId }])
            const giftCard = giftCardRequest.results[0];
            const isCorporate = giftCard.tags?.includes('Corporate');

            const amount = (giftCard.category === 'Public' ? 2000 : 3000) * giftCard.no_of_cards;

            let corporateName: string | undefined = undefined;
            if (isCorporate && giftCard.group_id) {
                try {
                    const group = await GroupRepository.getGroup(giftCard.group_id);
                    corporateName = group?.name || 'Unknown Corporation';
                } catch (groupErr) {
                    console.warn("[WARN] Failed to fetch corporate name for group_id:", giftCard.group_id, groupErr);
                    corporateName = 'Unknown Corporation';
                }
            }

            let panNumber = "";
            if (giftCard.payment_id) {
                const payment: any = await PaymentRepository.getPayment(giftCard.payment_id);
                panNumber = payment?.pan_number || "";
            }   
            const emailData = {
                giftCardRequestId: giftCard.id,
                sponsorName: sponsorUser.name,
                sponsorEmail: sponsorUser.email,
                sponsorPhone: sponsorUser.phone,
                giftCardAmount: formatNumber(amount),
                totalTrees: giftCard.no_of_cards,
                eventName: giftCard.event_name,
                giftCardDate: moment(new Date(giftCard.created_at)).format('MMMM DD, YYYY'),
                panNumber: panNumber || "N/A",
                ...(isCorporate && { 
                    corporateName: corporateName || 'Unknown Corporation',
                    tags: giftCard.tags?.join(', ') || 'No tags'
                })
            };

            const mailIds = (testMails && testMails.length !== 0) ?
            testMails :
            ['volunteer@14trees.org'];
            const templateName = isCorporate ? 'gifting-corpVolunteer.html' : 'gifting-volunteer.html';

            const statusMessage = await sendDashboardMail(
                templateName,
                emailData,
                mailIds,
                undefined,
                [],
                isCorporate ? 'New Corporate Volunteer Interest' : 'New Volunteer Interest'
            );

            if (statusMessage) {
                await GiftCardsRepository.updateGiftCardRequests({
                    mail_error: "Volunteer: " + statusMessage,
                }, { id: giftCard.id });
                return;
            }

            await GiftCardsRepository.updateGiftCardRequests({
                mail_status: giftCard.mail_status ? [...giftCard.mail_status, GiftReqMailStatus_Volunteer] : [GiftReqMailStatus_Volunteer],
            }, { id: giftCard.id });
        } catch (error) {
            const errorMessage = error instanceof Error ?
            `Failed to send gifting notification: ${error.message}` :
            'Failed to send gifting notification due to an unknown error';            
            await GiftCardsRepository.updateGiftCardRequests({
                mail_error: "Volunteer: " + errorMessage,
            }, { id: giftCardRequestId });
        }
    }
    
    public static async sendGiftingNotificationForCSR(
        giftCardRequestId: number,
        sponsorUser: User,
        testMails?: string[],
    ): Promise<void> {
        try {
            const giftCardRequest = await GiftCardsRepository.getGiftCardRequests(0, 1, [{ columnField: "id", operatorValue: "equals", value: giftCardRequestId }])
            const giftCard = giftCardRequest.results[0];
            const isCorporate = giftCard.tags?.includes('Corporate');
    
            const amount = (giftCard.category === 'Public' ? 2000 : 3000) * giftCard.no_of_cards;

            let corporateName: string | undefined = undefined;
            if (isCorporate && giftCard.group_id) {
                try {
                    const group = await GroupRepository.getGroup(giftCard.group_id);
                    corporateName = group?.name || 'Unknown Corporation';
                } catch (groupErr) {
                    console.warn("[WARN] Failed to fetch corporate name for group_id:", giftCard.group_id, groupErr);
                    corporateName = 'Unknown Corporation';
                }
            }
            let panNumber = "";
            if (giftCard.payment_id) {
                const payment: any = await PaymentRepository.getPayment(giftCard.payment_id);
                panNumber = payment?.pan_number || "";
            }
    
            const emailData = {
                giftCardRequestId: giftCard.id,
                sponsorName: sponsorUser.name,
                sponsorEmail: sponsorUser.email,
                sponsorPhone: sponsorUser.phone,
                giftCardAmount: formatNumber(amount),
                totalTrees: giftCard.no_of_cards,
                eventName: giftCard.event_name,
                giftCardDate: moment(new Date(giftCard.created_at)).format('MMMM DD, YYYY'),
                panNumber: panNumber || "N/A",
                ...(isCorporate && { 
                    corporateName: corporateName || 'Unknown Corporation',
                    tags: giftCard.tags?.join(', ') || 'No tags'
                })
            };
    
            const mailIds = (testMails && testMails.length !== 0) ?
            testMails :
            ['csr@14trees.org'];
            const templateName = isCorporate ? 'gifting-corpCSR.html' : 'gifting-csr.html';
    
            const statusMessage = await sendDashboardMail(
                templateName,
                emailData,
                mailIds,
                undefined,
                [],
                isCorporate ? 'New Corporate CSR Interest' : 'New CSR Interest'
            );
    
            if (statusMessage) {
                await GiftCardsRepository.updateGiftCardRequests({
                    mail_error: "CSR: " + statusMessage,
                }, { id: giftCard.id });
                return;
            }
    
            await GiftCardsRepository.updateGiftCardRequests({
                mail_status: giftCard.mail_status ? [...giftCard.mail_status, GiftReqMailStatus_CSR] : [GiftReqMailStatus_CSR],
            }, { id: giftCard.id });
        } catch (error) {
            const errorMessage = error instanceof Error ?
            `Failed to send gifting notification: ${error.message}` :
            'Failed to send gifting notification due to an unknown error';           
             await GiftCardsRepository.updateGiftCardRequests({
                mail_error: "CSR: " + errorMessage,
            }, { id: giftCardRequestId });
        }
    }

    public static async sendReferralGiftNotification(
        gift: any,
        testMails?: string[],
        ccMails?: string[]
    ): Promise<void> {
        try {
            if (!gift.rfr_id) {
                console.log("[INFO] No referral ID associated with this gift");
                return;
            }

            const referrals = await ReferralsRepository.getReferrals({ id: gift.rfr_id });
            if (referrals.length === 0) {
                console.log("[INFO] Referral not found for ID:", gift.rfr_id);
                return;
            }

            const referral = referrals[0];

            if (!referral.rfr) {
                console.log("[INFO] No referral code associated with this referral");
                return;
            }

            // Get referrer user separately
            const referrerUsersResp = await UserRepository.getUsers(0, 1, [
                { columnField: 'rfr', operatorValue: 'equals', value: referral.rfr }
            ]);
            const referrerUser = referrerUsersResp.results[0];

            if (!referrerUser) {
                console.log("[INFO] No user found with referral code:", referral.rfr);
                return;
            }

            // Get gifter user separately
            const gifterUsersResp = await UserRepository.getUsers(0, 1, [
                { columnField: 'id', operatorValue: 'equals', value: gift.user_id }
            ]);
            const gifterUser = gifterUsersResp.results[0];

            if (!gifterUser) {
                console.log("[ERROR] Gifter user not found for gift:", gift.id);
                return;
            }

            const referralBaseUrl = process.env.DASHBOARD_URL;
            const numberOfTrees = gift.no_of_cards || 0;
            const calculatedAmount = numberOfTrees * 2000;

            const emailData = {
                donor_name: gifterUser.name,
                trees: numberOfTrees,
                amount: formatNumber(calculatedAmount),
                referral_link: `${referralBaseUrl}/referral/${referral.rfr}`,
                current_year: new Date().getFullYear()
            };

            console.log("[DEBUG] Email data:", {
                originalAmount: gift.amount,
                calculatedAmount,
                numberOfTrees,
                finalAmount: emailData.amount
            });

            const ccMailIds = (ccMails && ccMails.length !== 0) ? ccMails : undefined;
            const mailIds = (testMails && testMails.length !== 0)
                ? testMails
                : [referrerUser.email];

            const templateName = 'gifting_referral.html';
            const statusMessage = await sendDashboardMail(
                templateName,
                emailData,
                mailIds,
                ccMailIds,
                undefined,
                'New Gift Through Your Referral!'
            );

            if (statusMessage) {
                console.error("[ERROR] Failed to send referral notification:", statusMessage);
            } else {
                console.log("[INFO] Successfully sent referral notification for gift:", gift.id);
            }

        } catch (error) {
            console.error("[ERROR] GiftService::sendReferralGiftNotification", error);
            throw new Error("Failed to send referral notification email");
        }
    }


    public static async getPlotTreesCntForAutoReserveTreesForGiftRequest(giftRequest: GiftCardRequest) {

        const treesCount = giftRequest.no_of_cards - (giftRequest as any).booked;
        if (treesCount <= 0) return [];

        const plotsToUse = await AutoPrsReqPlotsRepository.getPlots('gift');

        const plotIds: number[] = plotsToUse.map(item => item.plot_id);
        const plotsResp = await PlotRepository.getPlots(0, -1, [{ columnField: 'id', operatorValue: 'isAnyOf', value: plotIds }]);

        let remaining = treesCount;
        const plotTreeCnts
            = plotsResp.results
                .filter((plot: any) => plot.card_available)
                .map((plot: any) => {
                    const cnt = Math.min(plot.card_available, remaining);

                    if (remaining) remaining -= cnt;
                    return { plot_id: plot.id, trees_count: cnt, plot_name: plot.name }
                }).filter(item => item.trees_count);

        return plotTreeCnts;
    }

    public static async autoBookTreesForGiftRequest(giftRequest: GiftCardRequest) {
        const plotsToUse = await AutoPrsReqPlotsRepository.getPlots('gift');
        const plotIds: number[] = plotsToUse.map(item => item.plot_id);

        // reserve trees for gift request
        const treesCount = giftRequest.no_of_cards - Number((giftRequest as any).booked);
        if (treesCount > 0) {
            const treeIds = await TreeRepository.mapTreesInPlotToUserAndGroup(giftRequest.user_id, giftRequest.sponsor_id, giftRequest.group_id, plotIds, treesCount, false, true, false);

            // add user to donations group
            if (treeIds.length > 0) await UserGroupRepository.addUserToDonorGroup(giftRequest.user_id);
            await GiftCardsRepository.bookGiftCards(giftRequest.id, treeIds);
        }

        const updatedGR: any = await this.getGiftCardsRequest(giftRequest.id);
        if (updatedGR.no_of_cards === Number(updatedGR.booked)) {
            await GiftCardsRepository.updateGiftCardRequests(
                { status: updatedGR.no_of_cards === Number(updatedGR.assigned) ? GiftCardRequestStatus.completed : GiftCardRequestStatus.pendingAssignment },
                { id: giftRequest.id }
            );
        }
    }

    public static async sendCustomEmailToSponsor(giftCardRequest: any, giftCards: any[], templateName: string, attachCard: boolean, ccMails?: string[], testMails?: string[], subject?: string, attachments?: { filename: string; path: string }[]) {
        const emailData: any = {
            trees: [] as any[],
            trees_count: giftCards.length,
            user_email: giftCardRequest.user_email,
            user_name: giftCardRequest.user_name,
            event_name: giftCardRequest.event_name,
            group_name: giftCardRequest.group_name,
            company_logo_url: giftCardRequest.logo_url,
            count: 0
        };

        for (const giftCard of giftCards) {

            const treeData = {
                sapling_id: giftCard.sapling_id,
                dashboard_link: 'https://dashboard.14trees.org/profile/' + giftCard.sapling_id,
                planted_via: giftCard.planted_via,
                plant_type: giftCard.plant_type,
                scientific_name: giftCard.scientific_name,
                card_image_url: giftCard.card_image_url,
                event_name: giftCard.event_name,
                assigned_to_name: giftCard.assigned_to_name,
            };

            emailData.trees.push(treeData);
            emailData.count++;
        }

        const ccMailIds = (ccMails && ccMails.length !== 0) ? ccMails : undefined;
        const mailIds = (testMails && testMails.length !== 0) ? testMails : [emailData.user_email];

        let allAttachments: { filename: string; path: string }[] | undefined = attachments;
        if (attachCard) {
            const files: { filename: string; path: string }[] = []
            for (const tree of emailData.trees) {
                if (tree.card_image_url) {
                    files.push({
                        filename: tree.assigned_to_name + "_" + tree.card_image_url.split("/").slice(-1)[0],
                        path: tree.card_image_url
                    })
                }
            }

            if (files.length > 0) allAttachments = allAttachments ? [...allAttachments, ...files] : files;
        }

        const statusMessage: string = await sendDashboardMail(templateName, emailData, mailIds, ccMailIds, allAttachments, subject);

        if (statusMessage === '') {
            await GiftCardsRepository.updateGiftCardRequests(
                {
                    mail_sent: true,
                    updated_at: new Date()
                },
                {
                    id: giftCardRequest.id
                }
            );
        }
    }

    public static async redeemGiftCards(
        giftCards: GiftCard[],
        recipient: GiftRequestUser,
        sponsorUser: number | null,
        sponsorGroup: number | null,
        requestingUser: number,
        eventName: string,
        eventType: string,
        giftedBy: string,
        giftedOn: Date,
        primaryMessage: string = defaultMessage,
        logoMessage: string = defaultGiftMessages.logo
    ) {

        const treeUpdateRequest = {
            assigned_at: giftedOn,
            assigned_to: recipient.assignee,
            gifted_to: recipient.recipient,
            event_type: eventType?.trim() ? eventType.trim() : "3",
            description: eventName?.trim() ? eventName.trim() : null,
            gifted_by_name: giftedBy?.trim() ? giftedBy.trim() : null,
            updated_at: new Date(),
            planted_by: null,
            gifted_by: sponsorUser,
            user_tree_image: recipient.profile_image_url,
        }

        await TreeRepository.updateTrees(treeUpdateRequest, { id: { [Op.in]: giftCards.map(card => card.tree_id) } });
        await GiftCardsRepository.updateGiftCards(
            {
                gift_request_user_id: recipient.id,
                assigned_to: recipient.assignee,
                gifted_to: recipient.recipient,
                updated_at: new Date(),
            },
            { id: { [Op.in]: giftCards.map(card => card.id) } }
        );

        const trnData: GiftRedeemTransactionCreationAttributes = {
            group_id: sponsorGroup,
            user_id: sponsorUser,
            created_by: requestingUser,
            modified_by: requestingUser,
            recipient: recipient.recipient,
            occasion_name: eventName,
            occasion_type: eventType,
            gifted_by: giftedBy,
            gifted_on: giftedOn,
            primary_message: primaryMessage,
            secondary_message: "",
            logo_message: logoMessage,
            created_at: new Date(),
            updated_at: new Date(),
        }

        const cardIds = giftCards.map(card => card.id);
        if (sponsorGroup || sponsorUser) {
            const trn = await GRTransactionsRepository.createTransaction(trnData);
            await GRTransactionsRepository.addCardsToTransaction(trn.id, cardIds);
        }
    }

    public static async fullFillGiftCardRequestWithTransactions(giftRequest: GiftCardRequest) {

        const giftCards = await GiftCardsRepository.getBookedTrees(0, -1, [{ columnField: 'gift_card_request_id', operatorValue: 'equals', value: giftRequest.id }]);
        if (giftCards.results.length === 0) {
            throw new Error("No gift cards found for the given gift request.");
        }

        const giftCardsData = giftCards.results;
        const recipients = await GiftCardsRepository.getGiftRequestUsers(giftRequest.id);
        if (recipients.length === 0) {
            throw new Error("No recipients found for the given gift request.");
        }

        let idx = 0;
        for (const recipient of recipients) {
            const recipientGiftCards = giftCardsData.filter(card => card.gift_request_user_id === recipient.id);
            let treesCount = recipient.gifted_trees - recipientGiftCards.length;

            let giftCards: GiftCard[] = [];
            if (treesCount > 0) {
                for (; idx < giftCardsData.length && treesCount > 0; idx++) {
                    const card = giftCardsData[idx];
                    if (card.gift_request_user_id === null) {
                        card.gift_request_user_id = recipient.id;
                        treesCount--;
                        giftCards.push(card);
                    }
                }
            }

            // Redeem the gift cards for the recipient
            await this.redeemGiftCards(
                giftCards,
                recipient,
                giftRequest.sponsor_id || null,
                giftRequest.group_id || null,
                giftRequest.user_id,
                recipient.event_name || giftRequest.event_name || "",
                giftRequest.event_type || "",
                recipient.gifted_by || giftRequest.planted_by || "",
                recipient.gifted_on || giftRequest.gifted_on || new Date(),
                giftRequest.primary_message || defaultMessage,
                giftRequest.logo_message || ""
            );
        }
    }

    public static async reconcileGiftTransactions(giftRequest: GiftCardRequest, requestingUser?: number) {
        if (giftRequest.request_type != "Gift Cards") return;
        
        const giftCardsResp = await GiftCardsRepository.getBookedTrees(0, -1, [{ columnField: 'gift_card_request_id', operatorValue: 'equals', value: giftRequest.id }]);
        const giftCards = giftCardsResp.results;

        const unassignedGCIds = giftCards.filter(card => card.gift_request_user_id === null).map(card => card.id);

        let gcTrns: GRTCard[] = [];
        if (unassignedGCIds.length > 0) {
            gcTrns = await GRTransactionsRepository.getGRTCards({ gc_id: { [Op.in]: unassignedGCIds } });
            await GRTransactionsRepository.deleteCardsFromTransaction(unassignedGCIds);
        }

        const assignedGCIds = giftCards.filter(card => card.gift_request_user_id !== null).map(card => card.id);
        const gcIdToTrn: Record<number, number> = {}
        if (assignedGCIds.length > 0) {
            const transactionCards = await GRTransactionsRepository.getGRTCards({ gc_id: { [Op.in]: assignedGCIds } });
            for (const trnCard of transactionCards) {
                gcIdToTrn[trnCard.gc_id] = trnCard.grt_id;
            }
        }

        const assigneeToGC: Record<number, GiftCard[]> = {}
        for (const card of giftCards) {
            if (!card.gift_request_user_id) continue;

            if (!assigneeToGC[(card as any).assigned_to])
                assigneeToGC[(card as any).assigned_to] = []

            assigneeToGC[(card as any).assigned_to].push(card);
        }

        for (const cards of Object.values(assigneeToGC)) {
            const addToTrn: GiftCard[] = [];
            let trnId: number | null = null;

            cards.forEach(card => {
                if (!gcIdToTrn[card.id]) {
                    addToTrn.push(card)
                } else {
                    trnId = gcIdToTrn[card.id]
                }
            });

            if (addToTrn.length > 0) {
                if (trnId) {
                    await GRTransactionsRepository.addCardsToTransaction(trnId, addToTrn.map(card => card.id))
                } else if (addToTrn[0].gift_request_user_id) {
                    const assignedTo = (addToTrn[0] as any).assigned_to
                    const recipients = await GiftCardsRepository.getGiftRequestUsersByQuery({ id: addToTrn[0].gift_request_user_id })
                    const recipient = recipients.length === 1 ? recipients[0] : null

                    const trnData: GiftRedeemTransactionCreationAttributes = {
                        group_id: giftRequest.group_id,
                        user_id: giftRequest.user_id,
                        created_by: requestingUser || giftRequest.user_id,
                        modified_by: requestingUser || giftRequest.user_id,
                        recipient: assignedTo,
                        occasion_name: recipient?.event_name || giftRequest.event_name,
                        occasion_type: giftRequest.event_type,
                        gifted_by: recipient?.gifted_by || giftRequest.planted_by,
                        gifted_on: recipient?.gifted_on || giftRequest.gifted_on,
                        primary_message: giftRequest.primary_message || defaultGiftMessages.primary,
                        secondary_message: giftRequest.secondary_message || defaultGiftMessages.secondary,
                        logo_message: giftRequest.logo_message || defaultGiftMessages.logo,
                        created_at: new Date(),
                        updated_at: new Date(),
                    }

                    const cardIds = addToTrn.map(card => card.id);
                    const trn = await GRTransactionsRepository.createTransaction(trnData);
                    await GRTransactionsRepository.addCardsToTransaction(trn.id, cardIds);
                }
            }
        }

        const trnIds = gcTrns.map(item => item.grt_id);
        const existing = await GRTransactionsRepository.getGRTCards({ grt_id: { [Op.in]: trnIds }  })
        const nonExisting = gcTrns.filter(item => !existing.find(existingItem => existingItem.grt_id === item.grt_id))

        if (nonExisting.length > 0) {
            // delete unnecessary transactions
            await GRTransactionsRepository.deleteTransactions({ grt_id: { [Op.in]: nonExisting.map(item => item.grt_id)}});
        }
    }
}


export default GiftCardsService;