import { status } from "../helpers/status";
import { FilterItem } from "../models/pagination";
import { GroupRepository } from "../repo/groupRepo";
import { getWhereOptions } from "./helper/filters";
import { getOffsetAndLimitFromRequest } from "./helper/request";
import { Request, Response } from "express";
import { UploadFileToS3 } from "./helper/uploadtos3";
import TreeRepository from "../repo/treeRepo";
import { GiftCardsRepository } from "../repo/giftCardsRepo";
import { UserGroupRepository } from "../repo/userGroupRepo";
import { VisitRepository } from "../repo/visitsRepo";
import { OrderRepository } from "../repo/ordersRepo";
import { SortOrder } from "../models/common";
import GroupService from "../facade/groupService";
import { sequelize } from "../config/postgreDB";
import { QueryTypes } from "sequelize";
import { getSchema } from "../helpers/utils";


/*
    Model - Group
    CRUD Operations for groups table
*/

export const getGroups = async (req: Request, res: Response) => {
    const { offset, limit } = getOffsetAndLimitFromRequest(req);
    const filters: FilterItem[] = req.body?.filters || [];
    const orderBy: SortOrder[] = req.body?.order_by || [];

    try {
        let result = await GroupRepository.getGroups(offset, limit, filters, orderBy);
        res.status(status.success).send(result);
    } catch (error: any) {
        res.status(status.error).json({
            status: status.error,
            message: error.message,
        });
    }
}

export const addGroup = async (req: Request, res: Response) => {

    if (!req.body.name) {
        res.status(status.bad).send({ error: "Group name is required" });
        return;
    }
    if (!req.body.type) {
        res.status(status.bad).send({ error: "Group type is required" });
        return;
    }

    try {
        const data = req.body;
        const files: { logo: Express.Multer.File[], csv_file: Express.Multer.File[] } = req.files as any;
        if (files && files.logo && files.logo.length > 0) {
            const location = await UploadFileToS3(files.logo[0].filename, "logos");
            if (location) data['logo_url'] = location;
        }

        const group = await GroupRepository.addGroup(data);
        res.status(status.created).send(group);
    } catch (error) {
        res.status(status.bad).json({
            error: error,
        });
    }
}


export const updateGroup = async (req: Request, res: Response) => {
    try {

        const data = req.body;
        const files: { logo: Express.Multer.File[], csv_file: Express.Multer.File[] } = req.files as any;
        if (files && files.logo && files.logo.length > 0) {
            const location = await UploadFileToS3(files.logo[0].filename, "logos");
            if (location) data['logo_url'] = location;
        }

        let result = await GroupRepository.updateGroup(data)
        res.status(status.created).json(result);
    } catch (error) {
        console.log(error)
        res.status(status.error).json({ error: error });
    }
}


export const deleteGroup = async (req: Request, res: Response) => {
    try {
        let resp = await GroupRepository.deleteGroup(parseInt(req.params.id));
        console.log("Delete group response for id: %s", req.params.id, resp);
        res.status(status.success).json({
            message: "Group deleted successfully",
        });
    } catch (error: any) {
        res.status(status.bad).send({ error: error.message });
    }
}

export const searchGroups = async (req: Request, res: Response) => {
    const { offset, limit } = getOffsetAndLimitFromRequest(req);
    const searchStr = req.params.search;
    const filters: FilterItem[] = searchStr ? [{
        columnField: "name",       
        operatorValue: "contains",
        value: searchStr
    }] : [];

    try {
        let result = await GroupRepository.getGroups(offset, limit, filters, []);
        res.status(status.success).send(result);
    } catch (error: any) {
        res.status(status.error).json({
            status: status.error,
            message: error.message,
        });
    }
}

export const mergeGroups = async (req: Request, res: Response) => {

    const { primary_group, secondary_group, delete_secondary } = req.body;
    try {
        // Import required repositories at the top of function to avoid circular imports
        const { DonationRepository } = await import("../repo/donationsRepo");
        const { GRTransactionsRepository } = await import("../repo/giftRedeemTransactionsRepo");

        // Update trees
        const mappedTrees = { mapped_to_group: primary_group, updated_at: new Date() };
        await TreeRepository.updateTrees(mappedTrees, { mapped_to_group: secondary_group });

        const sponsoredTrees = { sponsored_by_group: primary_group, updated_at: new Date() };
        await TreeRepository.updateTrees(sponsoredTrees, { sponsored_by_group: secondary_group });

        // gift card requests
        const giftRequests = { group_id: primary_group, updated_at: new Date() };
        await GiftCardsRepository.updateGiftCardRequests(giftRequests, { group_id: secondary_group });

        // donations
        const donations = { group_id: primary_group, updated_at: new Date() };
        await DonationRepository.updateDonations(donations, { group_id: secondary_group });

        // gift redeem transactions
        const giftRedeemTransactions = { group_id: primary_group, updated_at: new Date() };
        await GRTransactionsRepository.updateTransactions(giftRedeemTransactions, { group_id: secondary_group });

        // user groups (group members)
        await UserGroupRepository.changeGroup(primary_group, secondary_group);

        // visits
        const visits = { group_id: primary_group, updated_at: new Date() };
        await VisitRepository.updateVisits(visits, { group_id: secondary_group });



        if (delete_secondary) {
            await GroupRepository.deleteGroup(secondary_group);
        }

        res.status(status.success).json();
    } catch (error: any) {
        console.log("[ERROR]", "groupsController.mergeGroups", error);
        res.status(status.error).send({ message: "Something went wrong. Please try again after some time!" });
    }
};

export const registerGroup = async (req: Request, res: Response) => {

    try {
        const { corporate, user } = req.body;
        if (!corporate?.name || !corporate?.type) {
            return res.status(status.bad).send({ error: "Group name and type are required" });
        }

        if (!user?.email || !user?.name) {
            return res.status(status.bad).send({ error: "User email and name are required" });
        }

        const response = await GroupService.registerGroup(corporate, user);
        res.status(status.created).send(response);
    } catch (error) {
        console.log("[ERROR]", "groupsController.registerGroup", error);
        res.status(status.error).send({ message: "Something went wrong. Please try again after some time!" });
    }

}

export const getGroupsCountForGroup = async (req: Request, res: Response) => {
  const { group_id } = req.params;
  const groupId = parseInt(group_id);

  if (isNaN(groupId)) {
    res.status(status.bad).json({
      status: status.bad,
      message: "Invalid Group!",
    })
    return;
  }

  try {
    // Import required repositories at the top of function to avoid circular imports
    const { DonationRepository } = await import("../repo/donationsRepo");

    // Trees counts (TreeRepository)
    const mappedTreesCount = await TreeRepository.treesCount({ mapped_to_group: groupId });
    const sponsoredTreesCount = await TreeRepository.treesCount({ sponsored_by_group: groupId });

    // Gift Card Requests counts
    const giftRequestsForGroupCount = await sequelize.query(
      `SELECT COUNT(*) as count FROM "${getSchema()}".gift_card_requests WHERE group_id = :groupId`,
      { replacements: { groupId }, type: QueryTypes.SELECT }
    );

    // Donations counts
    const donationsForGroupCount = await sequelize.query(
      `SELECT COUNT(*) as count FROM "${getSchema()}".donations WHERE group_id = :groupId`,
      { replacements: { groupId }, type: QueryTypes.SELECT }
    );

    // Gift Redeem Transactions counts
    const giftRedeemTransactionsForGroupCount = await sequelize.query(
      `SELECT COUNT(*) as count FROM "${getSchema()}".gift_redeem_transactions WHERE group_id = :groupId`,
      { replacements: { groupId }, type: QueryTypes.SELECT }
    );

    // User Groups count (members of this group)
    const userGroupsCount = await sequelize.query(
      `SELECT COUNT(*) as count FROM "${getSchema()}".user_groups WHERE group_id = :groupId`,
      { replacements: { groupId }, type: QueryTypes.SELECT }
    );

    // Visits count
    const visitsCount = await sequelize.query(
      `SELECT COUNT(*) as count FROM "${getSchema()}".visits WHERE group_id = :groupId`,
      { replacements: { groupId }, type: QueryTypes.SELECT }
    );



    // Helper function to extract count from query result
    const getCount = (result: any[]) => parseInt(result[0]?.count || 0);

    res.status(status.success).send({
      // Tree relationships
      trees: {
        mapped_trees: mappedTreesCount,
        sponsored_trees: sponsoredTreesCount
      },
      // Gift card requests
      gift_card_requests: getCount(giftRequestsForGroupCount),
      // Donations
      donations: getCount(donationsForGroupCount),
      // Gift redeem transactions
      gift_redeem_transactions: getCount(giftRedeemTransactionsForGroupCount),
      // Group members
      group_members: getCount(userGroupsCount),
      // Visits
      visits: getCount(visitsCount),
      
      // Summary totals
      total_relationships: 
        mappedTreesCount + sponsoredTreesCount +
        getCount(giftRequestsForGroupCount) +
        getCount(donationsForGroupCount) +
        getCount(giftRedeemTransactionsForGroupCount) +
        getCount(userGroupsCount) +
        getCount(visitsCount)
    });
  } catch (error: any) {
    console.log("[ERROR]", "GroupController::getGroupsCountForGroup", error);
    res.status(status.error).json({
      status: status.error,
      message: 'Something went wrong. Please try again after some time.',
    });
  }
}