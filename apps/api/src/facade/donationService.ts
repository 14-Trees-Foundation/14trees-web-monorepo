import { LandCategory, SortOrder } from "../models/common";
import { FilterItem, PaginatedResponse } from "../models/pagination"
import { ContributionOption, Donation, DonationCreationAttributes, DonationMailStatus_Accounts, DonationMailStatus_AckSent, DonationMailStatus_BackOffice, DonationMailStatus_CSR, DonationMailStatus_DashboardsSent, DonationMailStatus_Volunteer, DonationStatus, DonationStatus_UserSubmitted } from "../models/donation";
import { UserRepository } from "../repo/userRepo";
import { DonationRepository } from "../repo/donationsRepo";
import { DonationUser, DonationUserAttributes, DonationUserCreationAttributes } from "../models/donation_user";
import { DonationUserRepository } from "../repo/donationUsersRepo";
import TreeRepository from "../repo/treeRepo";
import { Op } from "sequelize";
import runWithConcurrency, { Task } from "../helpers/consurrency";
import { UserRelationRepository } from "../repo/userRelationsRepo";
import { sendDashboardMail } from '../services/gmail/gmail';
import { User } from "../models/user";
import { PaymentRepository } from "../repo/paymentsRepo";
import { formatNumber, numberToWords } from "../helpers/utils";
import moment from "moment";
import { GoogleDoc } from "../services/google";
import { uploadFileToS3 } from "../controllers/helper/uploadtos3";
import { GoogleSpreadsheet } from "../services/google";
import RazorpayService from "../services/razorpay/razorpay";
import { Tree, TreeAttributes } from "../models/tree";
import { PlotRepository } from "../repo/plotRepo";
import { AutoPrsReqPlotsRepository } from "../repo/autoPrsReqPlotRepo";
import { TemplateType } from "../models/email_template";
import { EmailTemplateRepository } from "../repo/emailTemplatesRepo";
import { ReferralsRepository } from "../repo/referralsRepo";
import { CampaignsRepository } from "../repo/campaignsRepo";

interface DonationUserRequest {
    recipient_name: string
    recipient_email: string | null,
    recipient_phone: string | null,
    assignee_name: string
    assignee_email: string | null,
    assignee_phone: string | null,
    relation: string | null,
    image_url: string | null,
    trees_count: number
}

interface CreateDonationRequest {
    sponsor_name: string;
    sponsor_email: string;
    sponsor_phone?: string | null;
    payment_id: number | null;
    category: LandCategory;
    grove: string | null; // Updated to match model
    trees_count: number | null;
    pledged_area_acres: number | null;
    continution_options: ContributionOption[],
    comments: string | null;
    amount_donated: number | null;
    visit_date: Date | null;
    donation_type: 'adopt' | 'donate';
    donation_method?: 'trees' | 'amount';
    status?: DonationStatus,
    tags?: string[]
    rfr?: string | null;
    c_key?: string | null;
}

export class DonationService {

    public static async createDonation(data: CreateDonationRequest): Promise<Donation> {
        const {
            sponsor_name,
            sponsor_email,
            sponsor_phone,
            grove,
            trees_count,
            pledged_area_acres,
            category,
            visit_date,
            amount_donated,
            payment_id,
            continution_options,
            comments,
            donation_type,
            donation_method,
            status,
            tags
        } = data;

        const sponsorUser = await UserRepository.upsertUser({
            name: sponsor_name,
            email: sponsor_email,
            phone: sponsor_phone
        }).catch((error: any) => {
            console.error("DonationService::createDonation", error);
            throw new Error("Failed to save sponsor details in the system!");
        });

        let rfr_id: number | null = null;
        if (data.rfr || data.c_key) {
            const references = await ReferralsRepository.getReferrals({
                rfr: data.rfr ? data.rfr : { [Op.is]: null },
                c_key: data.c_key ? data.c_key : { [Op.is]: null }
            });
            if (references.length === 1) rfr_id = references[0].id;
        }

        const request: DonationCreationAttributes = {
            user_id: sponsorUser.id,
            trees_count: trees_count || 0,
            pledged_area_acres: pledged_area_acres || null,
            category: category,
            donation_type,
            donation_method: donation_type === 'donate' ? donation_method : null,
            amount_donated: amount_donated,
            visit_date: donation_type === 'adopt' ? visit_date : null,
            grove: grove || '',
            payment_id: payment_id || null,
            created_by: sponsorUser.id,
            contribution_options: continution_options || null,
            comments: comments || null,
            status: status || DonationStatus_UserSubmitted,
            tags: tags || null,
            rfr_id: rfr_id,
        };

        const donation = await DonationRepository.createdDonation(
            request
        ).catch((error: any) => {
            console.error("DonationService::createDonation", error)
            throw new Error("Failed to save your donation request!")
        })

        return donation;
    }

    public static async createDonationUsers(donationId: number, usersData: DonationUserRequest[]) {

        const { addUsersData } = await this.upsertDonationUsersAndRelations(donationId, usersData);
        await DonationUserRepository.createDonationUsers(addUsersData).catch((error: any) => {
            console.error("DonationService::createDonationUsers", error)
            throw new Error("Failed to save donation users!")
        })
    }

    public static async insertDonationIntoGoogleSheet(
        donation: Donation,
        sponsor_name: string,
        sponsor_email: string,
        amount_donated: number,
    ): Promise<void> {
        const spreadsheetId = '12cIX-3-EReUq6tLWRUl-eMHdvRilccbK4mrubQ2b38E';
        const sheetName = 'WebsiteTxns';

        const sheet = new GoogleSpreadsheet();

        try {

            let panNumber = ""
            let paymentProof = "";
            if (donation.payment_id) {
                const payment: any = await PaymentRepository.getPayment(donation.payment_id);
                panNumber = payment?.pan_number || "";

                if (payment?.payment_history && payment.payment_history.length > 0) {
                    paymentProof = payment.payment_history[0].payment_proof || "";
                } else if (payment?.order_id) {
                    const razorpayService = new RazorpayService();
                    const payments = await razorpayService.getPayments(payment.order_id);
                    if (payments && payments.length > 0) {
                        const data: any = payments[0].acquirer_data;
                        if (data) {
                            const keys = Object.keys(data);
                            for (const key of keys) {
                                if (key.endsWith("transaction_id")) {
                                    paymentProof = data[key];
                                    break;
                                }
                            }
                        }
                    }
                }
            }

            // 1. Read headers from first row
            const headerRes = await sheet.getSpreadsheetData(spreadsheetId, `${sheetName}!1:1`);
            const headers: string[] = headerRes?.data?.values?.[0] || [];

            const date = new Date();
            const FY = date.getMonth() < 3 ? date.getFullYear() : date.getFullYear() + 1;;

            // 2. Construct data object
            const donationData = {
                Mode: paymentProof,
                Rec: FY + "/" + donation.id,
                Date: moment(date).format("DD/MM/YYYY"),
                Name: sponsor_name,
                Email: sponsor_email,
                "Total Amt": amount_donated ? formatNumber(amount_donated) : '',
                PAN: panNumber || '',
                Amount: amount_donated ? formatNumber(amount_donated) : '',
                AmountW: amount_donated ? numberToWords(amount_donated).split(' ').map((word: string) => word.charAt(0).toUpperCase() + word.slice(1)).join(' ') : '',
                FY: "Year " + (FY - 1) + "-" + (FY % 100)
            };

            // 3. Create row based on headers
            const row = headers.map((header: string) => donationData[header as keyof typeof donationData] || '');

            // 4. Insert row
            await sheet.insertRowData(spreadsheetId, sheetName, row);
            console.log('✅ Donation inserted into Google Sheet');
        } catch (error) {
            console.error('❌ Failed to insert donation:', error);
        }
    }



    /**
     * Tree Reservation 
     */

    public static async reserveSelectedTrees(donationId: number, treeIds: number[]) {
        // validate tree ids
        const validTrees = await TreeRepository.treesCount({
            mapped_to_user: { [Op.is]: null },
            mapped_to_group: { [Op.is]: null },
            assigned_to: { [Op.is]: null },
            donation_id: { [Op.is]: null },
            id: { [Op.in]: treeIds },
        })

        if (validTrees !== treeIds.length)
            throw new Error("Some tree ids are already reserved/assigned to someone else or are invalid!");


        const donation = await DonationRepository.getDonation(donationId);

        // reserved trees count
        const alreadyReserved = await TreeRepository.treesCount({
            donation_id: donationId,
        })

        if (alreadyReserved + treeIds.length > (donation.trees_count || 0))
            throw new Error("Can not reserve more trees than originally requested.")

        await TreeRepository.mapTreesToUserAndGroup(donation.user_id, donation.user_id, null, treeIds, donationId);
    }

    public static async getDonationReservationStats(donationId: number): Promise<{
        total_requested: number;
        already_reserved: number;
        remaining: number;
    }> {
        try {

            const donation = await DonationRepository.getDonation(donationId);
            const reservedCount = await TreeRepository.treesCount({
                donation_id: donationId
            });

            return {
                total_requested: donation.trees_count || 0,
                already_reserved: reservedCount,
                remaining: Math.max(0, (donation.trees_count || 0) - reservedCount)
            };
        } catch (error) {
            console.error("[ERROR] DonationService::getDonationReservationStats", error);
            throw new Error('Failed to calculate reservation stats');
        }
    }


    private static async reserveTreesInPlots(
        userId: number,
        groupId: number | null,
        plotTreeLimits: { plot_id: number, trees_count: number }[],
        bookNonGiftable: boolean = false,
        diversify: boolean = false,
        booAllHabitats: boolean = false,
        donation_id?: number | null
    ): Promise<number[]> {

        const updateConfig = {
            mapped_to_user: userId,
            mapped_to_group: groupId,
            sponsored_by_user: userId,
            sponsored_by_group: groupId,
            sponsored_at: new Date(),
            donation_id,
            mapped_at: new Date(),
            updated_at: new Date(),
        };

        const finalTreeIds: number[] = [];

        for (const plot of plotTreeLimits) {
            const trees = await TreeRepository.fetchTreesForPlot(plot.plot_id, plot.trees_count, bookNonGiftable, booAllHabitats, diversify);
            const selectedTrees = this.distributeTreesByPlantType(trees, plot.trees_count);

            finalTreeIds.push(...selectedTrees);
        }

        if (finalTreeIds.length > 0) {
            if (donation_id) {
                const donation = await DonationRepository.getDonation(donation_id);
                const alreadyReserved = await TreeRepository.treesCount({ donation_id });

                if (alreadyReserved + finalTreeIds.length > (donation.trees_count || 0)) {
                    throw new Error("Cannot reserve more trees than originally requested.");
                }
            }
            await TreeRepository.updateTrees(updateConfig, { id: { [Op.in]: finalTreeIds } });
        }

        return finalTreeIds;
    }

    /**
   * Distributes trees by plant type, ensuring diverse selection.
   */
    private static distributeTreesByPlantType(
        trees: { tree_id: number; plant_type: string }[],
        maxCount: number
    ): number[] {

        const plantTypeTreesMap = new Map<string, number[]>();

        for (const { tree_id, plant_type } of trees) {
            if (!plantTypeTreesMap.has(plant_type)) {
                plantTypeTreesMap.set(plant_type, []);
            }
            plantTypeTreesMap.get(plant_type)!.push(tree_id);
        }

        const treeIds2D = Array.from(plantTypeTreesMap.values());
        const selectedTreeIds: number[] = [];

        let i = 0, remaining = maxCount;
        while (remaining > 0) {
            let noMoreTrees = true;

            for (const treeIds of treeIds2D) {
                if (treeIds.length > i) {
                    noMoreTrees = false;
                    selectedTreeIds.push(treeIds[i]);
                    remaining--;
                }

                if (remaining === 0) break;
            }

            if (noMoreTrees) break;
            i++;
        }

        return selectedTreeIds;
    }

    public static async autoReserveTrees(
        donationId: number,
        plots: { plot_id: number, trees_count: number }[],
        diversify: boolean,
        bookAllHabits: boolean,
    ) {
        const donation = await DonationRepository.getDonation(donationId);

        const treesCount = plots.map(plot => plot.trees_count).reduce((prev, curr) => prev + curr, 0)
        const alreadyReserved = await TreeRepository.treesCount({
            donation_id: donationId,
        })
        if (treesCount + alreadyReserved > (donation.trees_count || 0))
            throw new Error("Can not reserve more trees than originally requested.")


        await this.reserveTreesInPlots(donation.user_id, null, plots, true, diversify, bookAllHabits, donation.id);
    }

    public static async unreserveSelectedTrees(
        donationId: number,
        treeIds: number[]
    ) {
        const treesCount = await TreeRepository.treesCount({
            id: { [Op.in]: treeIds },
            donation_id: donationId
        })

        if (treesCount !== treeIds.length)
            throw new Error("Some trees are not part of this donation request.")

        if (treeIds.length > 0) {
            const updateConfig = {
                mapped_to_user: null,
                mapped_to_group: null,
                mapped_at: null,
                sponsored_by_user: null,
                sponsored_by_group: null,
                sponsored_at: new Date(),
                donation_id: null,
                updated_at: new Date(),
            }

            await TreeRepository.updateTrees(updateConfig, { id: { [Op.in]: treeIds } });
        }
    }

    public static async unreserveAllTrees(donationId: number) {
        const updateConfig = {
            mapped_to_user: null,
            mapped_to_group: null,
            mapped_at: null,
            sponsored_by_user: null,
            sponsored_by_group: null,
            sponsored_at: new Date(),
            donation_id: null,
            updated_at: new Date(),
        }

        await TreeRepository.updateTrees(updateConfig, { donation_id: donationId });
    }

    public static async mapTreesToDonation(donation: Donation, treeIds: number[]) {

        const updateData: Partial<TreeAttributes> = {
            sponsored_by_user: donation.user_id,
            donation_id: donation.id,
            updated_at: new Date(),
        }

        await TreeRepository.updateTrees(updateData, { id: { [Op.in]: treeIds } })
    }

    public static async unmapTreesFromDonation(donation: Donation, treeIds: number[]) {
        const updateData: Partial<TreeAttributes> = {
            sponsored_by_user: null,
            donation_id: null,
            updated_at: new Date(),
        }

        await TreeRepository.updateTrees(updateData, { id: { [Op.in]: treeIds } })
    }

    public static async getMappedTrees(donationId: number, offset: number = 0, limit: number = 20, filters: FilterItem[] = [], orderBy: SortOrder[] = []): Promise<PaginatedResponse<Tree>> {
        // Inject a required filter for donation_id
        const donationFilter: FilterItem = {
            columnField: "donation_id",
            operatorValue: "equals",
            value: donationId,
        };

        const finalFilters = [donationFilter, ...filters];

        return await TreeRepository.getTrees(offset, limit, finalFilters, orderBy);
    }



    /**
     * Tree Assignment 
     */

    private static async getDonationTrees(donationId: number) {
        const treesResp =
            await TreeRepository.getTrees(
                0,
                -1,
                [{ columnField: 'donation_id', operatorValue: 'equals', value: donationId }]
            ).catch(error => {
                console.log("[ERROR]", "DonationService::getDonationTrees", error);
                throw new Error("Failed to fetch donation trees!");
            })

        return treesResp.results.map(tree => {
            return {
                tree_id: tree.id,
                gifted_to: tree.gifted_to,
                assigned_to: tree.assigned_to,
            }
        })
    }

    private static async assignTreesConcurrently(donationUsers: DonationUser[], userTreesMap: Record<number, number[]>) {
        const update = async (updateRequest: any, treeIds: number[]) => {
            await TreeRepository.updateTrees(updateRequest, { id: { [Op.in]: treeIds } });
        }

        const tasks: Task<void>[] = [];
        for (const user of donationUsers) {
            const treeIds = userTreesMap[user.id];

            const updateRequest = {
                assigned_at: new Date(),
                assigned_to: user.assignee,
                gifted_to: user.recipient,
                updated_at: new Date(),
                description: null,
                event_type: null,
                planted_by: null,
                gifted_by: null,
                gifted_by_name: null,
                user_tree_image: user.profile_image_url,
                memory_images: null,
            }

            tasks.push(() => update(updateRequest, treeIds));
        }

        await runWithConcurrency(tasks, 10);
    }

    public static async autoAssignTrees(donationId: number) {

        const donationUsers = await DonationUserRepository.getAllDonationUsers(donationId);
        const trees = await this.getDonationTrees(donationId);

        const userTreesMap: Record<number, number[]> = {};
        for (const user of donationUsers) {
            const userTrees = trees.filter(tree => (tree.gifted_to === user.recipient && tree.assigned_to === user.assignee));
            userTreesMap[user.id] = userTrees.map(tree => tree.tree_id);
        }

        let idx = 0;
        for (const user of donationUsers) {
            let count = user.trees_count - userTreesMap[user.id].length;

            while (count > 0) {
                if (idx >= trees.length) break;
                if (!trees[idx].assigned_to) {
                    userTreesMap[user.id].push(trees[idx].tree_id);
                    count--;
                }
                idx++;
            }
        }

        await this.assignTreesConcurrently(donationUsers, userTreesMap);
    }

    public static async assignTrees(
        donationId: number,
        userTrees: { du_id: number, tree_id: number }[]
    ) {

        // check valid trees
        const treesCount = await TreeRepository.treesCount({
            donation_id: donationId,
            id: { [Op.in]: userTrees.map(item => item.tree_id) }
        })

        if (treesCount !== userTrees.length)
            throw new Error("Some trees are not part of this donation request.")

        const donationUsers = await DonationUserRepository.getAllDonationUsers(donationId);
        const userTreesMap: Record<number, number[]> = {};
        for (const user of donationUsers) {
            const treeIds = userTrees.filter(tree => tree.du_id === user.id).map(tree => tree.tree_id);
            userTreesMap[user.id] = treeIds;
        }

        await this.assignTreesConcurrently(donationUsers, userTreesMap);
    }

    private static async unassignTreesForTreeIds(treeIds: number[]) {
        const updateRequest = {
            assigned_at: null,
            assigned_to: null,
            gifted_to: null,
            updated_at: new Date(),
            description: null,
            event_type: null,
            planted_by: null,
            gifted_by: null,
            gifted_by_name: null,
            user_tree_image: null,
            memory_images: null,
        }

        await TreeRepository.updateTrees(
            updateRequest,
            { id: { [Op.in]: treeIds } }
        ).catch(error => {
            console.log("[ERROR]", "DonationService::unassignTreesForTreeIds", error);
            throw new Error("Failed to unassign trees for users!");
        });
    }


    public static async unassignTrees(donationId: number) {

        const trees = await this.getDonationTrees(donationId);
        const treeIds = trees.map(tree => tree.tree_id);

        await this.unassignTreesForTreeIds(treeIds);
    }

    public static async unassignTreesForDonationIdAndTreeIds(donation_id: number, treeIds: number[]) {
        const treesCount = await TreeRepository.treesCount({
            donation_id: donation_id,
            id: { [Op.in]: treeIds }
        })

        if (treesCount !== treeIds.length)
            throw new Error("Some trees are not part of this donation request.")

        await this.unassignTreesForTreeIds(treeIds);
    }

    /**
     * Donation Users
     */

    private static async upsertDonationUsersAndRelations(donationId: number, users: any[]) {
        const addUsersData: DonationUserCreationAttributes[] = []
        const updateUsersData: DonationUserAttributes[] = []

        let count = 0;
        for (const user of users) {

            // recipient
            const recipientUser = {
                id: user.recipient,
                name: user.recipient_name,
                email: user.recipient_email,
                phone: user.recipient_phone,
            }
            const recipient = await UserRepository.upsertUserByEmailAndName(recipientUser);

            // assigneee
            const assigneeUser = {
                id: user.assignee,
                name: user.assignee_name,
                email: user.assignee_email,
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

            const treesCount = parseInt(user.trees_count) || 1;
            if (user.id) {
                updateUsersData.push({
                    ...user,
                    donation_id: donationId,
                    recipient: recipient.id,
                    assignee: assignee.id,
                    profile_image_url: user.image_url || null,
                    trees_count: treesCount,
                    updated_at: new Date(),
                })
            } else {
                addUsersData.push({
                    ...user,
                    donation_id: donationId,
                    trees_count: treesCount,
                    recipient: recipient.id,
                    assignee: assignee.id,
                    profile_image_url: user.image_url || null,
                    created_at: new Date(),
                    updated_at: new Date(),
                })
            }

            count += treesCount;
        }

        return { addUsersData, updateUsersData, count };
    }

    private static async deleteDonationUsers(donationId: number, donationUsers: DonationUser[]) {

        // unassign trees
        const trees = await this.getDonationTrees(donationId)
        const unassignTrees = trees.filter(tree => donationUsers.some(user => user.assignee === tree.assigned_to && user.recipient === tree.gifted_to));
        const treeIds = unassignTrees.map(tree => tree.tree_id);
        if (treeIds.length > 0) await this.unassignTreesForTreeIds(treeIds);


        // delete donation users
        await DonationUserRepository.deleteDonationUsers({
            id: { [Op.in]: donationUsers.map(user => user.id) },
            donation_id: donationId,
        }).catch(error => {
            console.log("[ERROR]", "DonationService::deleteDonationUsers", error);
            throw new Error("Failed to delete donation users!");
        })
    }


    public static async upsertDonationUsers(donationId: number, users: any[]) {


        const { addUsersData, updateUsersData, count } = await this.upsertDonationUsersAndRelations(donationId, users);
        const donation = await DonationRepository.getDonation(donationId);

        if ((donation.trees_count || 0) < count)
            throw new Error("You cannot assign more trees to users than originally requested.");

        const existingUsers = await DonationUserRepository.getAllDonationUsers(donationId);

        // delete extra users
        const deleteUsers = existingUsers.filter(item => users.findIndex((user: any) => user.id === item.id) === -1)
        if (deleteUsers.length > 0) {
            await this.deleteDonationUsers(donationId, deleteUsers)
        }
    }

    public static async upsertDonationUser(donationId: number, user: any) {

        // recipient
        const recipientUser = {
            id: user.recipient,
            name: user.recipient_name,
            email: user.recipient_email,
            phone: user.recipient_phone,
        }
        const recipient = await UserRepository.upsertUserByEmailAndName(recipientUser);

        // assigneee
        const assigneeUser = {
            id: user.assignee,
            name: user.assignee_name,
            email: user.assignee_email,
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

        let donationUserId: number = user.id;
        if (donationUserId) {
            await DonationUserRepository.updateDonationUsers({
                recipient: recipient.id,
                assignee: assignee.id,
                profile_image_url: user.profile_image_url,
                trees_count: user.trees_count,
                updated_at: new Date(),
            }, {
                id: user.id,
                donation_id: donationId,
            })
        } else {
            const createdUsers = await DonationUserRepository.createDonationUsers([{
                recipient: recipient.id,
                assignee: assignee.id,
                donation_id: donationId,
                profile_image_url: user.profile_image_url,
                trees_count: user.trees_count,
            }], true)

            if (createdUsers.length === 1) donationUserId = createdUsers[0].id;
        }

        const donationUsersResp = await DonationUserRepository.getDonationUsers(0, 1, [
            { columnField: 'id', operatorValue: 'equals', value: donationUserId }
        ])

        return donationUsersResp.results[0];
    }


    public static async deleteDonationUser(donationUserId: number) {

        const resp = await DonationUserRepository.getDonationUsers(0, 1, [
            { columnField: 'id', operatorValue: 'equals', value: donationUserId },
        ]).catch(error => {
            console.error("[ERROR] DonationService::deleteDonationUser - Failed to fetch user:", error);
            throw new Error("Failed to fetch donation user for deletion");
        });
    
        if (resp.results.length !== 1) {
            throw new Error("Donation user not found for given id");
        }
            
        try {
            // Get trees assigned to this user
            const assignedTrees = await TreeRepository.getTrees(0, -1, [
                { columnField: 'assigned_to', operatorValue: 'equals', value: donationUserId }
            ]);
            
            if (assignedTrees.results.length > 0) {
                console.log(`Unassigning ${assignedTrees.results.length} trees from user ${donationUserId}`);
                
                // Unassign trees by setting assigned_to to null
                const treeIds = assignedTrees.results.map(tree => tree.id);
                await this.unassignTreesForTreeIds(treeIds);
            }
        } catch (error) {
            console.error("[ERROR] DonationService::deleteDonationUser - Failed to unassign trees:", error);
            throw new Error("Failed to unassign trees before user deletion");
        }
    
        try {
            await DonationUserRepository.deleteDonationUsers({ 
                id: donationUserId 
            });
            console.log(`Successfully deleted donation user ${donationUserId}`);
        } catch (error) {
            console.error("[ERROR] DonationService::deleteDonationUser - Failed to delete user:", error);
            throw new Error("Failed to delete donation user");
        }
    }

    /**
     * Auto Process
     */

    public static async getPlotTreesCntForAutoReserveTreesForDonation(donation: Donation) {

        const treesCount = donation.trees_count - (donation as any).booked;
        if (treesCount <= 0) return [];

        const plotsToUse = await AutoPrsReqPlotsRepository.getPlots('donation');

        const plotIds: number[] = plotsToUse.map(item => item.plot_id);
        const plotsResp = await PlotRepository.getPlots(0, -1, [{ columnField: 'id', operatorValue: 'isAnyOf', value: plotIds }]);

        let remaining = treesCount;
        const plotTreeCnts
            = plotsResp.results
                .filter((plot: any) => plot.available_trees)
                .map((plot: any) => {
                    const cnt = Math.min(plot.available_trees, remaining);

                    if (remaining) remaining -= cnt;
                    return { plot_id: plot.id, trees_count: cnt, plot_name: plot.name }
                }).filter(item => item.trees_count);

        return plotTreeCnts;
    }

    public static async reserveTreesForDonation(donation: Donation) {
        const plotTreeCnts
            = await this.getPlotTreesCntForAutoReserveTreesForDonation(donation);

        if (plotTreeCnts.length === 0) return;

        await this.reserveTreesInPlots(donation.user_id, null, plotTreeCnts, true, true, false, donation.id);
    }


    public static async assignTreesForDonation(donation: Donation) {

        const donationUsers = await DonationUserRepository.getAllDonationUsers(donation.id);
        const treesCount = donationUsers.map(user => user.trees_count).reduce((prev, curr) => prev + curr, 0);
        if (treesCount < donation.trees_count) {

            const diffCnt = donation.trees_count - treesCount;
            const sponsor = donationUsers.find(user => user.recipient === donation.user_id);
            if (!sponsor) {
                await DonationUserRepository.createDonationUsers([{
                    recipient: donation.user_id,
                    assignee: donation.user_id,
                    trees_count: diffCnt,
                    profile_image_url: null,
                    donation_id: donation.id
                }])
            } else {
                await DonationUserRepository.updateDonationUsers({
                    trees_count: sponsor.trees_count + diffCnt,
                    updated_at: new Date(),
                }, { id: sponsor.id });
            }
        }

        await this.autoAssignTrees(donation.id);
    }


    /**
     * Donation Email functions
     */


    /**
     * @param donation 
     * @param sponsorUser 
     * @param testMails List of email ids (string[]) to receive test email
     * @param ccMails List of email ids (string[])
     */
    public static async sendDonationAcknowledgement(
        donation: Donation,
        sponsorUser: User,
        testMails?: string[],
        ccMails?: string[]
    ): Promise<void> {
        try {

            let panNumber = ""
            if (donation.payment_id) {
                const payment = await PaymentRepository.getPayment(donation.payment_id);
                panNumber = payment?.pan_number || "";
            }

            let referredBy = "";
            let campaignName = "";
            if (donation.rfr_id) {
                const referrals = await ReferralsRepository.getReferrals({ id: donation.rfr_id });
                if (referrals.length > 0) {
                    const referral = referrals[0];

                    if (referral.c_key) {
                        const campaignsResp = await CampaignsRepository.getCampaigns(0, 1, [{ columnField: 'c_key', operatorValue: 'equals', value: referral.c_key }])
                        if (campaignsResp.results.length > 0) {
                            campaignName = campaignsResp.results[0].name;
                        }
                    }

                    if (referral.rfr) {
                        const usersResp = await UserRepository.getUsers(0, 1, [{ columnField: 'rfr', operatorValue: 'equals', value: referral.rfr }]);
                        if (usersResp.results.length > 0) {
                            referredBy = usersResp.results[0].name;
                        }
                    }
                }
            }

            const date = new Date();
            const FY = date.getMonth() < 3 ? date.getFullYear() : date.getFullYear() + 1;
            const donationReceiptId = FY + "/" + donation.id;
            const docService = new GoogleDoc();
            const receiptId = await docService.get80GRecieptFileId({
                "{Name}": sponsorUser.name,
                "{FY}": "Year " + (FY - 1) + "-" + (FY % 100),
                "{Rec}": donationReceiptId,
                "{Date}": moment(new Date(donation.created_at)).format('MMMM DD, YYYY'),
                "{AmountW}": numberToWords(donation.amount_donated || 0).split(' ').map((word: string) => word.charAt(0).toUpperCase() + word.slice(1)).join(' '),
                "{PAN}": panNumber,
                "{Amt}": formatNumber(donation.amount_donated || 0),
                "{CO}": "",
                "{SG}": "",
                "{OT}": "✓",
            }, donationReceiptId);

            const resp = await docService.download(receiptId);

            const fileUrl = await uploadFileToS3('cards', resp, `donations/${donation.id}/${donationReceiptId}`);

            const emailData = {
                userDetails: {
                    name: sponsorUser.name,
                    email: sponsorUser.email,
                    phone: sponsorUser.phone,
                    panNumber: panNumber,
                },
                donationDetails: {
                    donationId: donation.id,
                    amount: formatNumber(donation.amount_donated || 0),
                    date: moment(new Date(donation.created_at)).format('MMMM DD, YYYY'),
                    treesCount: donation.trees_count,
                    referredBy: referredBy,
                    campaignName: campaignName,
                    donationType: donation.donation_type === 'donate'
                        ? donation.trees_count
                            ? 'trees'
                            : 'amount'
                        : 'adopted'
                }
            };

            const ccMailIds = (ccMails && ccMails.length !== 0) ? ccMails : undefined;
            const mailIds = (testMails && testMails.length !== 0) ?
                testMails :
                [sponsorUser.email];

            // Use template directly instead of querying from repository
            const templateName = 'donor-ack.html';
            const statusMessage = await sendDashboardMail(
                templateName,
                emailData,
                mailIds,
                ccMailIds,
                [{
                    filename: donationReceiptId + " " + sponsorUser.name + ".pdf",
                    path: fileUrl,
                }], // no attachments
                ' Thank You for Your Donation to 14Trees Foundation!'
            );

            if (statusMessage) {
                await DonationRepository.updateDonation(donation.id, { mail_error: statusMessage });
                console.error("[ERROR] DonationService::sendDonationAcknowledgement", statusMessage);
            } else {
                await DonationRepository.updateDonation(donation.id, {
                    mail_status: donation.mail_status ? [...donation.mail_status, DonationMailStatus_AckSent] : [DonationMailStatus_AckSent],
                });
            }

        } catch (error) {
            console.error("[ERROR] DonationService::sendDonationAcknowledgement", error);
            throw new Error("Failed to send acknowledgement email");
        }
    }

    public static async getEmailDataForDonation(donation: Donation, event_type: string): Promise<{ commonEmailData: any, treeData: any[] }> {
        // Get trees associated with the donation
        const trees = await DonationRepository.getDonationTrees(0, -1, [
            { columnField: 'donation_id', operatorValue: 'equals', value: donation.id }
        ]);

        if (!trees?.results?.length) {
            return { commonEmailData: {}, treeData: [] };
        }

        // Prepare tree data for email
        const treeData = trees.results.filter((tree: any) => !tree.mail_sent).map(tree => ({
            sapling_id: tree.sapling_id,
            dashboard_link: `${process.env.DASHBOARD_URL}/profile/${tree.sapling_id}`,
            planted_via: (tree as any).planted_via,
            plant_type: (tree as any).plant_type || '',
            scientific_name: (tree as any).scientific_name || '',
            card_image_url: (tree as any).card_image_url || '',
            event_name: (tree as any).event_name || '',
            recipient: (tree as any).recipient,
            assigned_to_name: (tree as any).assignee_name || 'Tree Planter', // Matches template
            assignee_name: (tree as any).assignee_name || '', // Keep for backward compatibility
            assignee_email: (tree as any).assignee_email || '',
            recipient_email: (tree as any).recipient_email || '',
            recipient_name: (tree as any).recipient_name || (tree as any).assignee_name || 'Recipient',
        }));

        // Common email data
        const commonEmailData = {
            trees: treeData,
            count: treeData.length,
            donation_id: donation.id,
            grove: donation.grove,
            category: donation.category,
            contribution_options: donation.contribution_options,
            names_for_plantation: donation.names_for_plantation,
            comments: donation.comments,
            event_name: (donation as any).event_name || '',
            event_type: event_type
        };

        return {
            commonEmailData,
            treeData
        }
    }

    public static async sendDashboardEmailToSponsor(donation: Donation, commonEmailData: any, treeData: any[], event_type: string, test_mails?: string[], sponsor_cc_mails?: string[]) {

        // Get user details
        const userResult = await UserRepository.getUsers(0, 1, [
            { columnField: 'id', operatorValue: 'equals', value: donation.user_id }
        ]);

        if (!userResult?.results?.length) {
            throw new Error('Sponsor user not found for the donation');
        }

        const user = userResult.results[0];

        const sponsorEmailData = {
            ...commonEmailData,
            user_name: user.name,
            name: user.name,
            email: user.email
        };

        const sponsorTemplateType: TemplateType = treeData.length > 1 ? 'sponsor-multi-trees' : 'sponsor-single-tree';
        const sponsorTemplates = await EmailTemplateRepository.getEmailTemplates({
            event_type,
            template_type: sponsorTemplateType
        });

        if (!sponsorTemplates?.length) {
            throw new Error('Sponsor email template not found');
        }

        const statusMessage = await sendDashboardMail(
            sponsorTemplates[0].template_name,
            sponsorEmailData,
            test_mails?.length ? test_mails : [user.email],
            sponsor_cc_mails || []
        );

        if (statusMessage) {
            await DonationRepository.updateDonation(donation.id, {
                mail_error: statusMessage,
                updated_at: new Date(),
            })
        } else {
            await DonationRepository.updateDonation(donation.id, {
                mail_status: donation.mail_status ? [...donation.mail_status, DonationMailStatus_DashboardsSent] : [DonationMailStatus_DashboardsSent],
                updated_at: new Date(),
            })
        }
    }

    public static async sendDashboardEmailsToRecipients(donation: Donation, commonEmailData: any, treeData: any[], event_type: string, test_mails?: string[], recipient_cc_mails?: string[]) {
        let recipientsMap = new Map<number, any>();

        treeData.forEach(tree => {
            if (tree.recipient) {
                if (!recipientsMap!.has(tree.recipient)) {
                    recipientsMap!.set(tree.recipient, []);
                }
                recipientsMap!.get(tree.recipient)?.push(tree);
            }
        });

        const recipientTemplateType: TemplateType = treeData.length > 1 ? 'receiver-multi-trees' : 'receiver-single-tree';
        const recipientTemplates = await EmailTemplateRepository.getEmailTemplates({
            event_type,
            template_type: recipientTemplateType
        });

        if (!recipientTemplates?.length) {
            throw new Error('Recipient email template not found');
        }

        // Send to each recipient
        for (const [recipient, recipientTrees] of recipientsMap) {
            const recipientEmailData = {
                ...commonEmailData,
                user_name: recipientTrees[0].recipient_name,
                assigned_to_name: recipientTrees[0].assignee_name,
                self: recipientTrees[0].recipient_name == recipientTrees[0].assignee_name,
                email: recipientTrees[0].recipient_email,
                trees: recipientTrees,
                count: recipientTrees.length
            };

            if ((!test_mails || test_mails.length === 0) && (recipientTrees[0].recipient_email as string).includes("14trees")) continue;
            const statusMessage = await sendDashboardMail(
                recipientTemplates[0].template_name,
                recipientEmailData,
                test_mails?.length ? test_mails : [recipientTrees[0].recipient_email],
                recipient_cc_mails || []
            );

            if (statusMessage) {
                await DonationUserRepository.updateDonationUsers({
                    mail_error: statusMessage,
                    updated_at: new Date(),
                }, { donation_id: donation.id, recipient: recipient });
            } else {
                await DonationUserRepository.updateDonationUsers({
                    mail_sent: true,
                    updated_at: new Date(),
                }, { donation_id: donation.id, recipient: recipient });
            }
        }
    }

    public static async sendDashboardEmailsToAssignees(donation: Donation, commonEmailData: any, treeData: any[], event_type: string, test_mails?: string[], assignee_cc_mails?: string[]) {
        let assigneesMap = new Map<string, any>();

        treeData.forEach(tree => {
            if (tree.assignee_email) {
                if (!assigneesMap!.has(tree.assignee_email)) {
                    assigneesMap!.set(tree.assignee_email, []);
                }
                assigneesMap!.get(tree.assignee_email)?.push(tree);
            }
        });

        const assigneeTemplateType: TemplateType = treeData.length > 1 ? 'receiver-multi-trees' : 'receiver-single-tree';
        const assigneeTemplates = await EmailTemplateRepository.getEmailTemplates({
            event_type,
            template_type: assigneeTemplateType
        });

        if (!assigneeTemplates?.length) {
            throw new Error('Assignee email template not found');
        }

        // Send to each assignee
        for (const [assigneeEmail, assigneeTrees] of assigneesMap) {
            const assigneeEmailData = {
                ...commonEmailData,
                user_name: assigneeTrees[0].assignee_name,
                assigned_to_name: assigneeTrees[0].assignee_name,
                //assigned_to_name: assigneeTrees[0].assigned_to_name,
                email: assigneeEmail,
                trees: assigneeTrees,
                count: assigneeTrees.length
            };

            await sendDashboardMail(
                assigneeTemplates[0].template_name,
                assigneeEmailData,
                test_mails || [assigneeEmail],
                assignee_cc_mails || []
            );
        }
    }

    public static async sendDonationNotificationToBackOffice(
        donationId: number,
        sponsorUser: User,
        testMails?: string[]
    ): Promise<void> {
        try {

            const donation = await DonationRepository.getDonation(donationId);

            // Prepare email content with donation details
            const emailData = {
                donationId: donation.id,
                sponsorName: sponsorUser.name,
                sponsorEmail: sponsorUser.email,
                sponsorPhone: sponsorUser.phone,
                donationAmount: formatNumber(donation.amount_donated || 0),
                donationDate: moment(new Date(donation.created_at)).format('MMMM DD, YYYY'),
                treesCount: donation.trees_count || 0
            };

            // Determine recipient emails - use testMails if provided, otherwise default to hardcoded email
            const mailIds = (testMails && testMails.length !== 0) ?
                testMails :
                ['dashboard@14trees.org'];

            // Set the email template to be used
            const templateName = 'backoffice_donation.html';

            const statusMessage = await sendDashboardMail(
                templateName,
                emailData,
                mailIds,
                undefined, // no CC
                [], // no attachments
                'New Donation Received - Notification'
            );

            if (statusMessage) {
                await DonationRepository.updateDonation(donation.id, {
                    mail_error: "BackOffice: " + statusMessage,
                });
                return;
            }

            await DonationRepository.updateDonation(donation.id, {
                mail_status: donation.mail_status ? [...donation.mail_status, DonationMailStatus_BackOffice] : [DonationMailStatus_BackOffice],
            });
        } catch (error) {
            // Throw a more specific error based on the caught exception
            const errorMessage = error instanceof Error ?
                `Failed to send donation notification: ${error.message}` :
                'Failed to send donation notification due to an unknown error';

            await DonationRepository.updateDonation(donationId, {
                mail_error: "BackOffice: " + errorMessage,
            });
        }
    }

    public static async sendDonationNotificationToAccounts(
        donationId: number,
        sponsorUser: User,
        testMails?: string[]
    ): Promise<void> {
        try {

            const donation = await DonationRepository.getDonation(donationId);

            const emailData = {
                donationId: donation.id,
                sponsorName: sponsorUser.name,
                sponsorEmail: sponsorUser.email,
                sponsorPhone: sponsorUser.phone,
                donationAmount: formatNumber(donation.amount_donated || 0),
                donationDate: moment(new Date(donation.created_at)).format('MMMM DD, YYYY'),
            };

            const mailIds = (testMails && testMails.length !== 0) ?
                testMails :
                ['accounts@14trees.org'];

            // Set the email template to be used
            const templateName = 'donation-accounts.html';

            const statusMessage = await sendDashboardMail(
                templateName,
                emailData,
                mailIds,
                undefined, // no CC
                [], // no attachments
                'New Donation Received - Notification'
            );

            if (statusMessage) {
                await DonationRepository.updateDonation(donation.id, {
                    mail_error: "Accounts: " + statusMessage,
                });
                return;
            }

            await DonationRepository.updateDonation(donation.id, {
                mail_status: donation.mail_status ? [...donation.mail_status, DonationMailStatus_Accounts] : [DonationMailStatus_Accounts],
            });
        } catch (error) {
            const errorMessage = error instanceof Error ?
                `Failed to send donation notification: ${error.message}` :
                'Failed to send donation notification due to an unknown error';

            await DonationRepository.updateDonation(donationId, {
                mail_error: "Accounts: " + errorMessage,
            });
        }
    }

    public static async sendDonationNotificationForVolunteers(
        donationId: number,
        sponsorUser: User,
        testMails?: string[]
    ): Promise<void> {
        try {

            const donation = await DonationRepository.getDonation(donationId);

            const emailData = {
                donationId: donation.id,
                sponsorName: sponsorUser.name,
                sponsorEmail: sponsorUser.email,
                sponsorPhone: sponsorUser.phone,
                donationAmount: formatNumber(donation.amount_donated || 0),
                donationDate: moment(new Date(donation.created_at)).format('MMMM DD, YYYY'),
            };

            const mailIds = (testMails && testMails.length !== 0) ?
                testMails :
                ['volunteer@14trees.org'];

            // Set the email template to be used
            const templateName = 'donation-volunteer.html';

            const statusMessage = await sendDashboardMail(
                templateName,
                emailData,
                mailIds,
                undefined, // no CC
                [], // no attachments
                'New Donation Received - Notification'
            );

            if (statusMessage) {
                await DonationRepository.updateDonation(donation.id, {
                    mail_error: "Volunteer: " + statusMessage,
                });
                return;
            }

            await DonationRepository.updateDonation(donation.id, {
                mail_status: donation.mail_status ? [...donation.mail_status, DonationMailStatus_Volunteer] : [DonationMailStatus_Volunteer],
            });
        } catch (error) {
            const errorMessage = error instanceof Error ?
                `Failed to send donation notification: ${error.message}` :
                'Failed to send donation notification due to an unknown error';

            await DonationRepository.updateDonation(donationId, {
                mail_error: "Volunteer: " + errorMessage,
            });
        }
    }

    public static async sendDonationNotificationForCSR(
        donationId: number,
        sponsorUser: User,
        testMails?: string[]
    ): Promise<void> {
        try {
            const donation = await DonationRepository.getDonation(donationId);

            const emailData = {
                donationId: donation.id,
                sponsorName: sponsorUser.name,
                sponsorEmail: sponsorUser.email,
                sponsorPhone: sponsorUser.phone,
                donationAmount: formatNumber(donation.amount_donated || 0),
                donationDate: moment(new Date(donation.created_at)).format('MMMM DD, YYYY'),
            };

            const mailIds = (testMails && testMails.length !== 0) ?
                testMails :
                ['csr@14trees.org'];

            // Set the email template to be used
            const templateName = 'donation-csr.html';

            const statusMessage = await sendDashboardMail(
                templateName,
                emailData,
                mailIds,
                undefined, // no CC
                [], // no attachments
                'New Donation Received - Notification'
            );

            if (statusMessage) {
                await DonationRepository.updateDonation(donation.id, {
                    mail_error: "CSR: " + statusMessage,
                });
                return;
            }

            await DonationRepository.updateDonation(donation.id, {
                mail_status: donation.mail_status ? [...donation.mail_status, DonationMailStatus_CSR] : [DonationMailStatus_CSR],
            });
        } catch (error) {
            const errorMessage = error instanceof Error ?
                `Failed to send donation notification: ${error.message}` :
                'Failed to send donation notification due to an unknown error';

            await DonationRepository.updateDonation(donationId, {
                mail_error: "CSR: " + errorMessage,
            });
        }
    }
}