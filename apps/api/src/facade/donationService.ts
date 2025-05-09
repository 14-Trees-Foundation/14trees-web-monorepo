import { LandCategory } from "../models/common";
import { ContributionOption, Donation, DonationCreationAttributes } from "../models/donation";
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
        } = data;
        const sponsorUser = await UserRepository.upsertUser({
            name: sponsor_name,
            email: sponsor_email,
            phone: sponsor_phone
        }).catch((error: any) => {
            console.error("DonationService::createDonation", error);
            throw new Error("Failed to save sponsor details in the system!");
        });
        const request: DonationCreationAttributes = {
            user_id: sponsorUser.id,
            trees_count: trees_count || 0,
            pledged_area_acres: pledged_area_acres || null,
            category: category,
            donation_type,
            donation_method: donation_type === 'donate' ? donation_method : null,
            amount_donated: donation_type === 'donate' && donation_method === 'amount' 
                ? amount_donated 
                : null,
            visit_date: donation_type === 'adopt' ? visit_date : null,
            grove: grove || '',
            payment_id: payment_id || null,
            created_by: sponsorUser.id,
            contribution_options: continution_options || null,
            comments: comments || null
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

        await TreeRepository.mapTreesToUserAndGroup(donation.user_id, null, treeIds, donationId);
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
            donation_id: null,
            updated_at: new Date(),
        }

        await TreeRepository.updateTrees(updateConfig, { donation_id: donationId });
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
            const recipient = await UserRepository.upsertUser(recipientUser);

            // assigneee
            const assigneeUser = {
                id: user.assignee,
                name: user.assignee_name,
                email: user.assignee_email,
                phone: user.assignee_phone,
            }
            const assignee = await UserRepository.upsertUser(assigneeUser);

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
        const recipient = await UserRepository.upsertUser(recipientUser);

        // assigneee
        const assigneeUser = {
            id: user.assignee,
            name: user.assignee_name,
            email: user.assignee_email,
            phone: user.assignee_phone,
        }
        const assignee = await UserRepository.upsertUser(assigneeUser);

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
            console.log("[ERROR]", "DonationService::deleteDonationUser", error);
            throw new Error("Failed fetch donation user for deletion!");
        })

        if (resp.results.length !== 1)
            throw new Error("Donation user not for given id")

        const donationId = resp.results[0].donation_id;
        const users = resp.results;

        await this.deleteDonationUsers(donationId, users);
    }


    public static async sendDonationAcknowledgement(
        donation: Donation,
        sponsorUser: User,
        testMails?: string[],
        ccMails?: string[]
    ): Promise<void> {
        try {
            const emailData = {
                user_name: sponsorUser.name,
                user_email: sponsorUser.email,
                id: donation.id,
                category: donation.category,
                grove: donation.grove,
                grove_type_other: donation.grove_type_other,
                trees_count: donation.trees_count,
                contribution_options: donation.contribution_options?.join(', ') || '',
                names_for_plantation: donation.names_for_plantation,
                comments: donation.comments,
                created_at: new Date(donation.created_at).toLocaleDateString(),
            };

            const ccMailIds = (ccMails && ccMails.length !== 0) ? ccMails : undefined;
            const mailIds = (testMails && testMails.length !== 0) ?
                testMails :
                [sponsorUser.email];

            // Use template directly instead of querying from repository
            const templateName = 'donor-sum.html';

            const statusMessage = await sendDashboardMail(
                templateName,
                emailData,
                mailIds,
                ccMailIds,
                [], // no attachments
                'Donation Request Received'
            );

            if (statusMessage) {
                console.error("[ERROR] DonationService::sendDonationAcknowledgement", statusMessage);
            }

        } catch (error) {
            console.error("[ERROR] DonationService::sendDonationAcknowledgement", error);
            throw new Error("Failed to send acknowledgement email");
        }
    }
}