import moment from "moment";
import { bulkUpdateSlides, createCopyOfTheCardTemplates, deleteUnwantedSlides, reorderSlides } from "../controllers/helper/slides";
import { GiftCardRequest, GiftReqMailStatus_Accounts, GiftReqMailStatus_BackOffice, GiftReqMailStatus_CSR, GiftReqMailStatus_Volunteer } from "../models/gift_card_request";
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

    public static async addGiftRequestToSpreadsheet(giftRequest: GiftCardRequest) {
        const sheet = new GoogleSpreadsheet();

        const sheetName = "GiftRequests"
        const spreadsheetId = process.env.GIFTING_SPREADSHEET;
        if (!spreadsheetId) {
            console.log("[WARN]", "GiftCardsService::addGiftRequestToSpreadsheet", "spreadsheet id (GIFTING_SPREADSHEET) is not present in env");
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
        testMails?: string[]
    ): Promise<void> {
        try {
            const giftCardRequest = await GiftCardsRepository.getGiftCardRequests(0, 1, [{ columnField: "id", operatorValue: "equals", value: giftCardRequestId }])
            const giftCard = giftCardRequest.results[0];

            const amount = (giftCard.category === 'Public' ? 2000 : 3000) * giftCard.no_of_cards;

            // Prepare email content with gifting details
            const emailData = {
                giftCardRequestId: giftCard.id,
                sponsorName: sponsorUser.name,
                sponsorEmail: sponsorUser.email,
                sponsorPhone: sponsorUser.phone,
                giftCardAmount: formatNumber(amount),
                giftCardDate: moment(new Date(giftCard.created_at)).format('MMMM DD, YYYY'),
            };

            // Determine recipient emails - use testMails if provided, otherwise default to hardcoded email
            const mailIds = (testMails && testMails.length !== 0) ?
                testMails :
                ['dashboard@14trees.org'];

            // Set the email template to be used
            const templateName = 'backoffice_gifting.html';

            const statusMessage = await sendDashboardMail(
                templateName,
                emailData,
                mailIds,
                undefined, // no CC
                [], // no attachments
                'New Gift Card Request Received - Notification'
            );

            if (statusMessage) {
                await GiftCardsRepository.updateGiftCardRequests({
                    mail_error: "BackOffice: " + statusMessage,
                }, { id: giftCard.id });
                return;
            }

            await GiftCardsRepository.updateGiftCardRequests({
                mail_status: giftCard.mail_status ? [...giftCard.mail_status, GiftReqMailStatus_BackOffice] : [GiftReqMailStatus_BackOffice],
            }, { id: giftCard.id });
        } catch (error) {
            // Throw a more specific error based on the caught exception
            const errorMessage = error instanceof Error ?
                `Failed to send gifting notification: ${error.message}` :
                'Failed to send gifting notification due to an unknown error';

            await GiftCardsRepository.updateGiftCardRequests({
                mail_error: "BackOffice: " + errorMessage,
            }, { id: giftCardRequestId });
        }
    }

    public static async sendGiftingNotificationToAccounts(
        giftCardRequestId: number,
        sponsorUser: User,
        testMails?: string[]
    ): Promise<void> {
        try {
            const giftCardRequest = await GiftCardsRepository.getGiftCardRequests(0, 1, [{ columnField: "id", operatorValue: "equals", value: giftCardRequestId }])
            const giftCard = giftCardRequest.results[0];

            const amount = (giftCard.category === 'Public' ? 2000 : 3000) * giftCard.no_of_cards;

            const emailData = {
                giftCardRequestId: giftCard.id,
                sponsorName: sponsorUser.name,
                sponsorEmail: sponsorUser.email,
                sponsorPhone: sponsorUser.phone,
                giftCardAmount: formatNumber(amount),
                giftCardDate: moment(new Date(giftCard.created_at)).format('MMMM DD, YYYY'),
            };

            const mailIds = (testMails && testMails.length !== 0) ?
                testMails :
                ['accounts@14trees.org'];

            // Set the email template to be used
            const templateName = 'gifting-accounts.html';

            const statusMessage = await sendDashboardMail(
                templateName,
                emailData,
                mailIds,
                undefined, // no CC
                [], // no attachments
                'New Gift Card Request Received - Notification'
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
        testMails?: string[]
    ): Promise<void> {
        try {
            const giftCardRequest = await GiftCardsRepository.getGiftCardRequests(0, 1, [{ columnField: "id", operatorValue: "equals", value: giftCardRequestId }])
            const giftCard = giftCardRequest.results[0];

            const amount = (giftCard.category === 'Public' ? 2000 : 3000) * giftCard.no_of_cards;

            const emailData = {
                giftCardRequestId: giftCard.id,
                sponsorName: sponsorUser.name,
                sponsorEmail: sponsorUser.email,
                sponsorPhone: sponsorUser.phone,
                giftCardAmount: formatNumber(amount),
                giftCardDate: moment(new Date(giftCard.created_at)).format('MMMM DD, YYYY'),
            };

            const mailIds = (testMails && testMails.length !== 0) ?
                testMails :
                ['volunteer@14trees.org'];

            // Set the email template to be used
            const templateName = 'gifting-volunteer.html';

            const statusMessage = await sendDashboardMail(
                templateName,
                emailData,
                mailIds,
                undefined, // no CC
                [], // no attachments
                'New Gift Card Request Received - Notification'
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
        testMails?: string[]
    ): Promise<void> {
        try {
            const giftCardRequest = await GiftCardsRepository.getGiftCardRequests(0, 1, [{ columnField: "id", operatorValue: "equals", value: giftCardRequestId }])
            const giftCard = giftCardRequest.results[0];

            const amount = (giftCard.category === 'Public' ? 2000 : 3000) * giftCard.no_of_cards;

            const emailData = {
                giftCardRequestId: giftCard.id,
                sponsorName: sponsorUser.name,
                sponsorEmail: sponsorUser.email,
                sponsorPhone: sponsorUser.phone,
                giftCardAmount: formatNumber(amount),
                giftCardDate: moment(new Date(giftCard.created_at)).format('MMMM DD, YYYY'),
            };

            const mailIds = (testMails && testMails.length !== 0) ?
                testMails :
                ['csr@14trees.org'];

            // Set the email template to be used
            const templateName = 'gifting-csr.html';

            const statusMessage = await sendDashboardMail(
                templateName,
                emailData,
                mailIds,
                undefined, // no CC
                [], // no attachments
                'New Gift Card Request Received - Notification'
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
}


export default GiftCardsService;