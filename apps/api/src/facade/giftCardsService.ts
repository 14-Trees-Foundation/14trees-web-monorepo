import moment from "moment";
import { Op } from "sequelize";
import { bulkUpdateSlides, createCopyOfTheCardTemplates, deleteUnwantedSlides, reorderSlides } from "../controllers/helper/slides";
import { GiftCardRequest, GiftReqMailStatus_Accounts, GiftReqMailStatus_BackOffice, GiftReqMailStatus_CSR, GiftReqMailStatus_Volunteer } from "../models/gift_card_request";
import PlantTypeTemplateRepository from "../repo/plantTypeTemplateRepo";
import TreeRepository from "../repo/treeRepo";
import { copyFile, GoogleSpreadsheet } from "../services/google";
import { formatNumber, numberToWords } from "../helpers/utils";
import { PaymentRepository } from "../repo/paymentsRepo";
import { sendDashboardMail } from "../services/gmail/gmail";
import { GiftCardsRepository } from "../repo/giftCardsRepo";
import { UserRepository } from "../repo/userRepo";
import { GRTransactionsRepository } from "../repo/giftRedeemTransactionsRepo"
import { ViewPermissionRepository } from "../repo/viewPermissionsRepo"
import { User } from "../models/user";
import { GiftRedeemTransaction } from "../models/gift_redeem_transaction"
import { View } from "../models/permissions"

const defaultMessage = "Dear {recipient},\n\n"
    + 'We are immensely delighted to share that a tree has been planted in your name at the 14 Trees Foundation, Pune. This tree will be nurtured in your honour, rejuvenating ecosystems, supporting biodiversity, and helping offset the harmful effects of climate change.'
    + "\n\n"
    + 'We invite you to visit 14 Trees and firsthand experience the growth and contribution of your tree towards a greener future.'


class GiftCardsService {

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
                ['vivekpbhagwat@gmail.com'];

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
                ['vivekpbhagwat@gmail.com'];

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
                ['vivekpbhagwat@gmail.com'];

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
                ['vivekpbhagwat@gmail.com'];

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

    // Main function for birthday reminders (5-day window + monthly)
    public static async sendMissedGiftAlerts() {
        try {
            // Get common dashboard data
            const dashboardData = await this.getDashboardData();
            if (!dashboardData.success) return dashboardData;
            if (!dashboardData.data) return { success: false, message: 'No dashboard data' };

            const results = [];
            const daysOffset = -1; // Yesterday
            const daysWindow = 1; // Single day

            // Process each dashboard
            for (const { dashboard, recipients, groupUsers } of dashboardData.data) {
                // Filter users with yesterday's birthdays
                const birthdayUsers = this.filterUsersByBirthday(
                    groupUsers,
                    daysOffset,
                    daysWindow
                );

                if (!birthdayUsers.length) continue;

                // Check gift redemption status
                const redemptionStatus = await this.checkGiftRedemptionStatus(
                    birthdayUsers.map(u => u.id)
                );

                const missedGiftUsers = birthdayUsers.filter(
                    user => !redemptionStatus[user.id]
                );

                if (!missedGiftUsers.length) continue;

                results.push({
                    dashboard,
                    recipients,
                    missedGiftUsers
                });
            }

            return { success: true, results };
        } catch (error: unknown) {
            if (error instanceof Error) {
                console.error('Error in sendMissedGiftAlerts:', error.message);
                return { success: false, error: error.message };
            } else {
                console.error('Error in sendMissedGiftAlerts:', error);
                return { success: false, error: String(error) };
            }
        }
    }

    public static async sendBirthdayReminders(options: { isMonthlyReport?: boolean } = {}) {
        try {
            // Get common dashboard data
            const dashboardData = await this.getDashboardData();
            if (!dashboardData.success) return dashboardData;
            if (!dashboardData.data) return { success: false, message: 'No dashboard data' };

            const results = [];
            const specialMode = options.isMonthlyReport ? 'nextNDays' : 'exactInNDays';
            const daysWindow = options.isMonthlyReport ? 30 : 5;
            const daysOffset = 0; // Starting from today

            for (const { dashboard, recipients, groupUsers } of dashboardData.data) {
                // Extract groupId from dashboard.path
                const match = dashboard.path.match(/\/csr\/dashboard\/(\d+)$/);
                if (!match) continue;

                const groupId = parseInt(match[1], 10);
                if (isNaN(groupId)) continue;

                // Filter users with upcoming birthdays
                const birthdayUsers = this.filterUsersByBirthday(
                    groupUsers,
                    daysOffset,
                    daysWindow,
                    specialMode 
                );

                if (!birthdayUsers.length) continue;

                // Get available trees for the group
                const treeAnalytics = await TreeRepository.getMappedGiftTreesAnalytics(groupId, null);
                let availableTrees = 0;

                if (treeAnalytics?.total_trees && treeAnalytics?.gifted_trees) {
                    const total = parseInt(treeAnalytics.total_trees, 10);
                    const gifted = parseInt(treeAnalytics.gifted_trees, 10);

                    if (!isNaN(total) && !isNaN(gifted)) {
                        availableTrees = total - gifted;
                    }
                }

                results.push({
                    dashboard,
                    recipients,
                    birthdayUsers,
                    availableTrees,
                    daysWindow,
                    isMonthlyReport: options.isMonthlyReport
                });
            }
            return { success: true, data: results };

        } catch (error: unknown) {
            if (error instanceof Error) {
                console.error('Error in sendBirthdayReminders:', error.message);
                return { success: false, error: error.message };
            } else {
                console.error('Error in sendBirthdayReminders:', error);
                return { success: false, error: String(error) };
            }
        }

        return
    }

    // ================ COMMON FUNCTIONS ================

    private static async getDashboardData() {
        try {
            // 1. Get all corporate dashboard views (filter by path starting with '/csr/')
            const dashboards = await View.findAll({
                where: {
                    path: {
                        [Op.iLike]: '/csr/%'  // Case-insensitive match for paths starting with '/csr/'
                    }
                }
            });

            if (!dashboards.length) {
                return { success: false, message: 'No corporate dashboards found' };
            }

            const dashboardData = [];

            // 2. Process each dashboard
            for (const dashboard of dashboards) {
                if (!dashboard.id || !dashboard.path) continue;

                // 3. Extract group ID from path (e.g. /csr/dashboard/144 → 144)
                const match = dashboard.path.match(/\/csr\/dashboard\/(\d+)$/);
                if (!match) continue;

                const groupId = parseInt(match[1], 10);
                if (isNaN(groupId)) continue;

                // 4. Get notification recipients
                const viewPermissions = await ViewPermissionRepository.getViewUsers(dashboard.id);
                const recipientUserIds = viewPermissions.map(vp => vp.user_id);

                if (!recipientUserIds.length) continue;

                // 5. Get recipient details
                const { results: recipients } = await UserRepository.getUsers(
                    0, -1, [{
                        columnField: "id",
                        operatorValue: "isAnyOf",
                        value: recipientUserIds
                    }]
                );

                // 6. Get group users who received trees
                const groupUsers = await this.getGroupTreeRecipients(groupId);
                if (!groupUsers.length) continue;

                dashboardData.push({
                    dashboard,
                    recipients,
                    groupUsers
                });
            }

            return { success: true, data: dashboardData };
        } catch (error: unknown) {
            if (error instanceof Error) {
                console.error('Error in getDashboardData:', error.message);
                return { success: false, error: error.message };
            } else {
                console.error('Error in getDashboardData:', error);
                return { success: false, error: String(error) };
            }
        }
    }


    private static async getGroupTreeRecipients(groupId: number) {
        const { results: trees } = await TreeRepository.getMappedGiftTrees(
            0, -1, null, groupId, []
        );

        const userIds = [...new Set(
            trees.filter(t => t.assigned_to).map(t => t.assigned_to)
        )] as number[];

        if (!userIds.length) return [];

        const { results: users } = await UserRepository.getUsers(
            0, -1, [{
                columnField: "id",
                operatorValue: "isAnyOf",
                value: userIds
            }]
        );

        return users;
    }

    private static filterUsersByBirthday(
        users: User[],
        daysOffset: number,
        daysWindow: number,
        specialMode: 'nextNDays' | 'yesterday' | 'exactInNDays' = 'nextNDays'
    ) {
        const today = new Date();
    
        // 1. YESTERDAY
        if (specialMode === 'yesterday') {
            const yesterday = new Date(today);
            yesterday.setDate(today.getDate() - 1);
            const month = yesterday.getMonth() + 1;
            const day = yesterday.getDate();
            return users.filter(user => {
                if (!user.birth_date) return false;
                const birthDate = new Date(user.birth_date);
                return birthDate.getMonth() + 1 === month && birthDate.getDate() === day;
            });
        }
    
        // 2. EXACTLY IN N DAYS
        if (specialMode === 'exactInNDays') {
            const exactDate = new Date(today);
            exactDate.setDate(today.getDate() + daysWindow);
            const month = exactDate.getMonth() + 1;
            const day = exactDate.getDate();
            return users.filter(user => {
                if (!user.birth_date) return false;
                const birthDate = new Date(user.birth_date);
                return birthDate.getMonth() + 1 === month && birthDate.getDate() === day;
            });
        }
    
        // 3. DEFAULT: NEXT N DAYS
        const targetDates = Array.from({ length: daysWindow }, (_, i) => {
            const date = new Date(today);
            date.setDate(today.getDate() + daysOffset + i);
            return { month: date.getMonth() + 1, day: date.getDate() };
        });
    
        return users.filter(user => {
            if (!user.birth_date) return false;
            const birthDate = new Date(user.birth_date);
            return targetDates.some(d =>
                birthDate.getMonth() + 1 === d.month && birthDate.getDate() === d.day
            );
        });
    }
    
    private static async checkGiftRedemptionStatus(userIds: number[]) {
        const { results: transactions } = await GRTransactionsRepository.getTransactions(
            0, -1, { recipient: userIds }
        );

        const statusMap: Record<number, boolean> = {};
        userIds.forEach(id => {
            statusMap[id] = transactions.some(t => t.recipient === id);
        });
        return statusMap;
    }

    public static async sendMonthlyBirthdayNotificationEmail(
        dashboard: any,
        recipients: any[],
        birthdayUsers: any[],
        testMails?: string[]
    ): Promise<void> {
        const emailData = {
            dashboardName: dashboard.name,
            birthdayUsers: birthdayUsers.map((user: any) => ({
                name: user.name,
                email: user.email,
                birth_date: user.birth_date,
            }))

        };

        const mailIds = testMails?.length ? testMails : recipients.map(u => u.email);
        const templateName = 'birthday-notify-monthly.html';

        await sendDashboardMail(
            templateName,
            emailData,
            mailIds,
            undefined,
            [],
            `Monthly Employee Birthday Reminder – ${dashboard.name}`
        );
    }

    public static async sendUpcomingBirthdayNotificationEmail(
        dashboard: any,
        recipients: any[],
        birthdayUsers: any[],
        testMails?: string[]
    ): Promise<void> {
        const emailData = {
            dashboardName: dashboard.name,
            birthdayUsers,
        };

        const mailIds = testMails?.length ? testMails : recipients.map(u => u.email);
        const templateName = 'birthday-notify-upcoming.html';

        await sendDashboardMail(
            templateName,
            emailData,
            mailIds,
            undefined,
            [],
            `Upcoming Employee Birthdays (Next 5 Days) – ${dashboard.name}`
        );
    }

    public static async sendMissedGiftNotificationEmail(
        dashboard: any,
        recipients: any[],
        missedUsers: any[],
        testMails?: string[]
    ): Promise<void> {
        const emailData = {
            dashboardName: dashboard.name,
            missedUsers,
        };

        const mailIds = testMails?.length ? testMails : recipients.map(u => u.email);
        const templateName = 'birthday-missed-gift.html';

        await sendDashboardMail(
            templateName,
            emailData,
            mailIds,
            undefined,
            [],
            `Missed Gift Notification for Birthdays – ${dashboard.name}`
        );
    }
}

export default GiftCardsService;