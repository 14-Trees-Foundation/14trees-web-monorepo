import { Request, Response } from "express";
import { status } from "../helpers/status";
import { Logger } from "../helpers/logger";
import TreeRepository from "../repo/treeRepo";
import { getOffsetAndLimitFromRequest } from "./helper/request";
import { Op, QueryTypes, WhereOptions } from "sequelize";
import { sequelize } from "../config/postgreDB";
import { FilterItem } from "../models/pagination";
import { Tree } from "../models/tree";
import { SortOrder } from "../models/common";
import { GroupRepository } from "../repo/groupRepo";
import { getSchema } from '../helpers/utils';
import { GoogleSpreadsheet } from "../services/google";

/*
  Model - Tree
  CRUD Operations for trees collection
*/


export const addTree = async (req: Request, res: Response) => {
  try {
    let tree = await TreeRepository.addTree(req.body);
    res.status(status.created).send(tree);
  } catch (error: any) {
    await Logger.logError('treesController', 'addTree', error, req);
    res.status(status.error).send({ error: error });
  }
};

export const getTree = async (req: Request, res: Response) => {
  if (!req.query.sapling_id) {
    res.status(status.bad).send({ error: "Sapling ID required" });
    return;
  }

  try {
    const result = TreeRepository.getTreeBySaplingId(req.query.sapling_id.toString())
    if (result === null) {
      res.status(status.notfound).send();
    } else {
      res.status(status.success).send(result);
    }
  } catch (error: any) {
    await Logger.logError('treesController', 'getTree', error, req);
    res.status(status.error).send({ error: error });
  }
};

export const getTrees = async (req: Request, res: Response) => {
  const { offset, limit } = getOffsetAndLimitFromRequest(req);
  const filters: FilterItem[] = req.body?.filters;
  const orderBy: SortOrder[] = req.body?.order_by;

  try {
    let result = await TreeRepository.getTrees(offset, limit, filters, orderBy);
    res.status(status.success).send(result);
  } catch (error: any) {
    await Logger.logError('treesController', 'getTrees', error, req);
    res.status(status.error).send({ error: error });
  }
};

export const getTreeTypes = async (req: Request, res: Response) => {
  const { offset, limit } = getOffsetAndLimitFromRequest(req);
  const filters: FilterItem[] = req.body?.filters;
  const orderBy: SortOrder[] = req.body?.order_by;

  try {
    // Fetch all matching trees (no pagination) so we can aggregate counts per type
    const treesResp = await TreeRepository.getTrees(0, -1, filters, orderBy);
    const trees = treesResp?.results || [];

    const map = new Map<number | string, {
      plant_type_id: number | string | null,
      plant_type: string | null,
      habit: string | null,
      illustration_s3_path: string | null,
      info_card_s3_path: string | null,
      count: number
    }>();

    trees.forEach((t: any) => {
      const key = t.plant_type_id ?? t.tree_id ?? 'unknown';
      const existing = map.get(key);
      if (existing) {
        existing.count += 1;
      } else {
        map.set(key, {
          plant_type_id: key,
          plant_type: t.plant_type ?? null,
          habit: t.habit ?? null,
          illustration_s3_path: t.illustration_s3_path ?? null,
          info_card_s3_path: t.info_card_s3_path ?? null,
          count: 1
        });
      }
    });

    // Convert map to array and sort by count desc
    let aggregated = Array.from(map.values());
    aggregated.sort((a, b) => b.count - a.count);

    const totalTypes = aggregated.length;

    // Apply pagination to aggregated results
    let paginated = aggregated;
    if (limit > 0) {
      paginated = aggregated.slice(offset, offset + limit);
    } else if (offset > 0) {
      paginated = aggregated.slice(offset);
    }

    // Ensure counts are integers
    paginated = paginated.map(item => ({ ...item, count: Number(item.count) }));

    res.status(status.success).send({
      total: String(totalTypes),
      results: paginated
    });
  } catch (error: any) {
    await Logger.logError('treesController', 'getTreeTypes', error, req);
    res.status(status.error).send({ error: error });
  }
}

export const updateTree = async (req: Request, res: Response) => {
  try {
    const tree = await TreeRepository.updateTree(req.body, Array.isArray(req.files) ? req.files : [])
    res.status(status.success).json(tree);
  } catch (error: any) {
    await Logger.logError('treesController', 'updateTree', error, req);
    res.status(status.error).send({ error: error });
  }
};

export const changeTreesPlot = async (req: Request, res: Response) => {
  const { tree_ids, plot_id } = req.body;
  try {
    const updateFields = { plot_id: plot_id };
    const whereClause = {
      id: { [Op.in]: tree_ids }
    };

    await TreeRepository.updateTrees(updateFields, whereClause)
    res.status(status.success).send();
  } catch (error: any) {
    await Logger.logError('treesController', 'changeTreesPlot', error, req);
    res.status(status.error).send({ error: error });
  }
};

export const deleteTree = async (req: Request, res: Response) => {
  try {
    const resp = await TreeRepository.deleteTree(req.params.id);
    res.status(status.success).send({ message: "Tree deleted successfully" });
  } catch (error: any) {
    await Logger.logError('treesController', 'deleteTree', error, req);
    res.status(status.error).send({ error: error });
  }
};

export const getTreeTags = async (req: Request, res: Response) => {
  try {
    const response = await TreeRepository.getTreeTags(0, 100);
    res.status(status.success).send(response);
  } catch (error: any) {
    await Logger.logError('treesController', 'getTreeTags', error, req);
    res.status(status.error).send({ error: error });
  }
}

export const getTreeFromId = async (req: Request, res: Response) => {
  try {
    if (!req.query.id) {
      throw new Error("tree id is required")
    }
    let result = await TreeRepository.getTreeByTreeId(Number(req.query.id));
    res.status(status.success).send(result);
  } catch (error: any) {
    await Logger.logError('treesController', 'getTreeFromId', error, req);
    res.status(status.error).send({ error: error });
  }
};

export const treeCountByPlot = async (req: Request, res: Response) => {
  const { offset, limit } = getOffsetAndLimitFromRequest(req);
  const query = `select p."name" , p._id , count(t._id)
                    from trees t, plots p 
                    where t.plot_id =p."_id"
                    group by p."name" , p._id
                    order by count(t._id) desc
                    offset ${offset} limit ${limit};
    `
  try {
    let result = await sequelize.query(query, {
      type: QueryTypes.SELECT
    })
    res.status(status.success).send(result);
  } catch (error: any) {
    await Logger.logError('treesController', 'treeCountByPlot', error, req);
    res.status(status.error).send({ error: error });
  }
};

export const treeLoggedByDate = async (req: Request, res: Response) => {
  const { offset, limit } = getOffsetAndLimitFromRequest(req);
  try {
    const query = `SELECT DATE(t.created_at) AS "_id", COUNT(t.id)
                        FROM "${getSchema()}".trees AS t
                        GROUP BY DATE(t.created_at)
                        ORDER BY DATE(t.created_at) DESC;
                        -- OFFSET ${offset} LIMIT ${limit};
        `
    let result: any[] = await sequelize.query(query, {
      type: QueryTypes.SELECT
    })
    result.forEach(item => item.count = parseInt(item.count))
    res.status(status.success).send(result);
  } catch (error: any) {
    res.status(status.error).json({
      status: status.error,
      message: error.message,
    });
  }
};

export const treeLogByUser = async (req: Request, res: Response) => {
  const { offset, limit } = getOffsetAndLimitFromRequest(req);
  try {
    const query = `SELECT t.date_added, s.name, count(t._id)
                            FROM trees AS t, onsitestaffs AS s
                            WHERE t.user_id IS NOT NULL AND t.user_id = s._id
                            GROUP BY t.date_added, s.name
                            ORDER BY t.date_added DESC
                            OFFSET ${offset} LIMIT ${limit};
            `
    let result = await sequelize.query(query, {
      type: QueryTypes.SELECT
    })
    res.status(status.success).send(result);
  } catch (error: any) {
    res.status(status.error).json({
      status: status.error,
      message: error.message,
    });
  }
};

export const treeLogByPlot = async (req: Request, res: Response) => {
  const { offset, limit } = getOffsetAndLimitFromRequest(req);
  try {
    const query = `SELECT t.date_added, p.name, count(t._id)
                                FROM trees AS t, plots AS p
                                WHERE t.plot_id IS NOT NULL AND t.plot_id = p._id
                                GROUP BY t.date_added, p.name
                                ORDER BY t.date_added DESC
                                OFFSET ${offset} LIMIT ${limit};
                `
    let result = await sequelize.query(query, {
      type: QueryTypes.SELECT
    })
    res.status(status.success).send(result);
  } catch (error: any) {
    res.status(status.error).json({
      status: status.error,
      message: error.message,
    });
  }
};

export const treeCountTreeType = async (req: Request, res: Response) => {
  const { offset, limit } = getOffsetAndLimitFromRequest(req);
  try {
    const query = `SELECT t.tree_id, tt.name, tt.image, count(t._id)
                                FROM trees AS t, tree_types AS tt
                                WHERE t.tree_id = tt._id
                                GROUP BY t.tree_id, tt.name, tt.image
                                ORDER BY count(t._id) DESC
                                OFFSET ${offset} LIMIT ${limit};
                `
    let result = await sequelize.query(query, {
      type: QueryTypes.SELECT
    })
    res.status(status.success).send(result);
  } catch (error: any) {
    res.status(status.error).json({
      status: status.error,
      message: error.message,
    });
  }
};

export const treeTypeCountByPlot = async (req: Request, res: Response) => {
  const { offset, limit } = getOffsetAndLimitFromRequest(req);
  try {

    const query = `SELECT tt.name as tree_type, p.name  as plot, count(t._id)
                                FROM trees AS t, tree_types AS tt, plots AS p
                                WHERE t.tree_id = tt._id AND t.plot_id = p._id
                                GROUP BY tt._id, tt.name, p._id, p.name
                                ORDER BY count(t._id) DESC
                                OFFSET ${offset} LIMIT ${limit};
                `
    let result = await sequelize.query(query, {
      type: QueryTypes.SELECT
    })
    res.status(status.success).send(result);
  } catch (error: any) {
    res.status(status.error).json({
      status: status.error,
      message: error.message,
    });
  }
};

export const getAssignedTrees = async (req: Request, res: Response) => {
  const userId = parseInt(req.params.user_id);
  if (isNaN(userId)) {
    res.status(status.bad).json({
      status: status.bad,
      message: "Invalid User ID!",
    })
    return;
  }

  try {
    const result = await TreeRepository.getTrees(0, -1, [{ operatorValue: 'equals', value: userId, columnField: 'assigned_to' }])
    const response = result.results.map((tree: any) => ({
      sapling_id: tree.sapling_id,
      plant_type: tree.plant_type,
      created_at: tree.created_at,
      image: tree.image
    }))
    res.status(status.success).send(response);
  } catch (error: any) {
    res.status(status.error).json({
      status: status.error,
      message: error.message,
    });
  }
};

export const getTreePlantationsInfo = async (req: Request, res: Response) => {
  const { offset, limit } = getOffsetAndLimitFromRequest(req);
  const filters: FilterItem[] = req.body?.filters;

  try {
    const result = await TreeRepository.getTreePlantationsInfo(offset, limit, filters);
    res.status(status.success).send(result);
  } catch (error: any) {
    console.log("[ERROR]", "TreesController::getTreePlantationsInfo", error);
    res.status(status.error).json({
      status: status.error,
      message: 'Something went wrong. Please try again after some time.',
    });
  }
}

export const getGiftableTrees = async (req: Request, res: Response) => {
  const { offset, limit } = getOffsetAndLimitFromRequest(req);
  const filters: FilterItem[] = req.body?.filters;
  const includeNoGiftable = req.body?.include_no_giftable;
  const inlcudeAllHabits = req.body?.include_all_habits;

  try {
    const result = await TreeRepository.getGiftableTrees(offset, limit, filters, includeNoGiftable, inlcudeAllHabits);
    res.status(status.success).send(result);
  } catch (error: any) {
    console.log("[ERROR]", "TreesController::getGiftableTrees", error);
    res.status(status.error).json({
      status: status.error,
      message: 'Something went wrong. Please try again after some time.',
    });
  }
}

export const getTreesCountForUser = async (req: Request, res: Response) => {
  const { user_id } = req.params;
  const userId = parseInt(user_id);

  if (isNaN(userId)) {
    res.status(status.bad).json({
      status: status.bad,
      message: "Invalid User!",
    })
    return;
  }

  try {
    // Import required repositories at the top of function to avoid circular imports
    const { GiftCardsRepository } = await import("../repo/giftCardsRepo");
    const { DonationRepository } = await import("../repo/donationsRepo");
    const { DonationUserRepository } = await import("../repo/donationUsersRepo");
    const { UserGroupRepository } = await import("../repo/userGroupRepo");
    const { UserRelationRepository } = await import("../repo/userRelationsRepo");
    const { VisitUsersRepository } = await import("../repo/visitUsersRepo");
    const { AlbumRepository } = await import("../repo/albumRepo");
    const EventRepository = (await import("../repo/eventsRepo")).default;

    // Trees counts (TreeRepository)
    const mappedTreesCount = await TreeRepository.treesCount({ mapped_to_user: userId });
    const sponsoredTreesCount = await TreeRepository.treesCount({ sponsored_by_user: userId });
    const assignedTreesCount = await TreeRepository.treesCount({ assigned_to: userId });
    const giftedByTreesCount = await TreeRepository.treesCount({ gifted_by: userId });
    const giftedToTreesCount = await TreeRepository.treesCount({ gifted_to: userId });

    // Gift Card Requests counts
    const giftRequestsAsUserCount = await sequelize.query(
      `SELECT COUNT(*) as count FROM "${getSchema()}".gift_card_requests WHERE user_id = :userId`,
      { replacements: { userId }, type: QueryTypes.SELECT }
    );
    const giftRequestsAsSponsorCount = await sequelize.query(
      `SELECT COUNT(*) as count FROM "${getSchema()}".gift_card_requests WHERE sponsor_id = :userId`,
      { replacements: { userId }, type: QueryTypes.SELECT }
    );
    const giftRequestsAsCreatorCount = await sequelize.query(
      `SELECT COUNT(*) as count FROM "${getSchema()}".gift_card_requests WHERE created_by = :userId`,
      { replacements: { userId }, type: QueryTypes.SELECT }
    );
    const giftRequestsAsProcessorCount = await sequelize.query(
      `SELECT COUNT(*) as count FROM "${getSchema()}".gift_card_requests WHERE processed_by = :userId`,
      { replacements: { userId }, type: QueryTypes.SELECT }
    );

    // Gift Cards counts
    const giftCardsGiftedToCount = await sequelize.query(
      `SELECT COUNT(*) as count FROM "${getSchema()}".gift_cards WHERE gifted_to = :userId`,
      { replacements: { userId }, type: QueryTypes.SELECT }
    );
    const giftCardsAssignedToCount = await sequelize.query(
      `SELECT COUNT(*) as count FROM "${getSchema()}".gift_cards WHERE assigned_to = :userId`,
      { replacements: { userId }, type: QueryTypes.SELECT }
    );

    // Gift Request Users counts
    const giftRequestUsersAsRecipientCount = await sequelize.query(
      `SELECT COUNT(*) as count FROM "${getSchema()}".gift_request_users WHERE recipient = :userId`,
      { replacements: { userId }, type: QueryTypes.SELECT }
    );
    const giftRequestUsersAsAssigneeCount = await sequelize.query(
      `SELECT COUNT(*) as count FROM "${getSchema()}".gift_request_users WHERE assignee = :userId`,
      { replacements: { userId }, type: QueryTypes.SELECT }
    );

    // Donations counts
    const donationsAsUserCount = await sequelize.query(
      `SELECT COUNT(*) as count FROM "${getSchema()}".donations WHERE user_id = :userId`,
      { replacements: { userId }, type: QueryTypes.SELECT }
    );
    const donationsAsProcessorCount = await sequelize.query(
      `SELECT COUNT(*) as count FROM "${getSchema()}".donations WHERE processed_by = :userId`,
      { replacements: { userId }, type: QueryTypes.SELECT }
    );
    const donationsAsCreatorCount = await sequelize.query(
      `SELECT COUNT(*) as count FROM "${getSchema()}".donations WHERE created_by = :userId`,
      { replacements: { userId }, type: QueryTypes.SELECT }
    );

    // Donation Users counts
    const donationUsersAsAssigneeCount = await sequelize.query(
      `SELECT COUNT(*) as count FROM "${getSchema()}".donation_users WHERE assignee = :userId`,
      { replacements: { userId }, type: QueryTypes.SELECT }
    );
    const donationUsersAsRecipientCount = await sequelize.query(
      `SELECT COUNT(*) as count FROM "${getSchema()}".donation_users WHERE recipient = :userId`,
      { replacements: { userId }, type: QueryTypes.SELECT }
    );

    // User Groups count
    const userGroupsCount = await UserGroupRepository.countUserGroups(userId);

    // User Relations counts
    const userRelationsAsSecondaryCount = await sequelize.query(
      `SELECT COUNT(*) as count FROM "${getSchema()}".user_relations WHERE secondary_user = :userId`,
      { replacements: { userId }, type: QueryTypes.SELECT }
    );
    const userRelationsAsPrimaryCount = await sequelize.query(
      `SELECT COUNT(*) as count FROM "${getSchema()}".user_relations WHERE primary_user = :userId`,
      { replacements: { userId }, type: QueryTypes.SELECT }
    );

    // Visit Users count
    const visitUsersCount = await sequelize.query(
      `SELECT COUNT(*) as count FROM "${getSchema()}".visit_users WHERE user_id = :userId`,
      { replacements: { userId }, type: QueryTypes.SELECT }
    );

    // Albums count
    const albumsCount = await sequelize.query(
      `SELECT COUNT(*) as count FROM "${getSchema()}".albums WHERE user_id = :userId`,
      { replacements: { userId }, type: QueryTypes.SELECT }
    );

    // Events count
    const eventsCount = await sequelize.query(
      `SELECT COUNT(*) as count FROM "${getSchema()}".events WHERE assigned_by = :userId`,
      { replacements: { userId }, type: QueryTypes.SELECT }
    );

    // Gift Redeem Transactions counts
    const giftRedeemTransactionsAsRecipientCount = await sequelize.query(
      `SELECT COUNT(*) as count FROM "${getSchema()}".gift_redeem_transactions WHERE recipient = :userId`,
      { replacements: { userId }, type: QueryTypes.SELECT }
    );
    const giftRedeemTransactionsAsCreatorCount = await sequelize.query(
      `SELECT COUNT(*) as count FROM "${getSchema()}".gift_redeem_transactions WHERE created_by = :userId`,
      { replacements: { userId }, type: QueryTypes.SELECT }
    );

    // View Permissions count
    const viewPermissionsCount = await sequelize.query(
      `SELECT COUNT(*) as count FROM "${getSchema()}".view_permissions WHERE user_id = :userId`,
      { replacements: { userId }, type: QueryTypes.SELECT }
    );

    // Helper function to extract count from query result
    const getCount = (result: any[]) => parseInt(result[0]?.count || 0);

    res.status(status.success).send({
      // Tree relationships
      trees: {
        mapped_trees: mappedTreesCount,
        sponsored_trees: sponsoredTreesCount,
        assigned_trees: assignedTreesCount,
        gifted_trees: giftedByTreesCount,
        received_gift_trees: giftedToTreesCount
      },
      // Gift card requests
      gift_card_requests: {
        as_user: getCount(giftRequestsAsUserCount),
        as_sponsor: getCount(giftRequestsAsSponsorCount),
        as_creator: getCount(giftRequestsAsCreatorCount),
        as_processor: getCount(giftRequestsAsProcessorCount)
      },
      // Gift cards
      gift_cards: {
        gifted_to: getCount(giftCardsGiftedToCount),
        assigned_to: getCount(giftCardsAssignedToCount)
      },
      // Gift request users
      gift_request_users: {
        as_recipient: getCount(giftRequestUsersAsRecipientCount),
        as_assignee: getCount(giftRequestUsersAsAssigneeCount)
      },
      // Gift redeem transactions
      gift_redeem_transactions: {
        as_recipient: getCount(giftRedeemTransactionsAsRecipientCount),
        as_creator: getCount(giftRedeemTransactionsAsCreatorCount)
      },
      // Donations
      donations: {
        as_donor: getCount(donationsAsUserCount),
        as_processor: getCount(donationsAsProcessorCount),
        as_creator: getCount(donationsAsCreatorCount)
      },
      // Donation users
      donation_users: {
        as_assignee: getCount(donationUsersAsAssigneeCount),
        as_recipient: getCount(donationUsersAsRecipientCount)
      },
      // Other relationships
      user_groups: userGroupsCount,
      user_relations: {
        as_secondary: getCount(userRelationsAsSecondaryCount),
        as_primary: getCount(userRelationsAsPrimaryCount)
      },
      visit_users: getCount(visitUsersCount),
      albums: getCount(albumsCount),
      events_assigned_by: getCount(eventsCount),
      view_permissions: getCount(viewPermissionsCount),
      
      // Summary totals
      total_relationships: 
        mappedTreesCount + sponsoredTreesCount + assignedTreesCount + giftedByTreesCount + giftedToTreesCount +
        getCount(giftRequestsAsUserCount) + getCount(giftRequestsAsSponsorCount) + getCount(giftRequestsAsCreatorCount) + getCount(giftRequestsAsProcessorCount) +
        getCount(giftCardsGiftedToCount) + getCount(giftCardsAssignedToCount) +
        getCount(giftRequestUsersAsRecipientCount) + getCount(giftRequestUsersAsAssigneeCount) +
        getCount(donationsAsUserCount) + getCount(donationsAsProcessorCount) + getCount(donationsAsCreatorCount) +
        getCount(donationUsersAsAssigneeCount) + getCount(donationUsersAsRecipientCount) +
        userGroupsCount +
        getCount(userRelationsAsSecondaryCount) + getCount(userRelationsAsPrimaryCount) +
        getCount(visitUsersCount) + getCount(albumsCount) + getCount(eventsCount) +
        getCount(giftRedeemTransactionsAsRecipientCount) + getCount(giftRedeemTransactionsAsCreatorCount) +
        getCount(viewPermissionsCount)
    });
  } catch (error: any) {
    console.log("[ERROR]", "TreesController::getTreesCountForUser", error);
    res.status(status.error).json({
      status: status.error,
      message: 'Something went wrong. Please try again after some time.',
    });
  }
}

export const getCountSummaryForGroup = async (req: Request, res: Response) => {
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
    // Trees counts (TreeRepository)
    const mappedTreesCount = await TreeRepository.treesCount({ mapped_to_group: groupId });
    const sponsoredTreesCount = await TreeRepository.treesCount({ sponsored_by_group: groupId });

    // Gifted trees count: sponsored by group AND gifted to someone
    const giftedByTreesCountResult = await sequelize.query(
      `SELECT COUNT(*) as count FROM "${getSchema()}".trees WHERE sponsored_by_group = :groupId AND gifted_to IS NOT NULL`,
      { replacements: { groupId }, type: QueryTypes.SELECT }
    );
    const giftedByTreesCount = parseInt((giftedByTreesCountResult[0] as any)?.count || 0);

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

    // User Groups count (members in this group)
    const groupMembersCount = await sequelize.query(
      `SELECT COUNT(*) as count FROM "${getSchema()}".user_groups WHERE group_id = :groupId`,
      { replacements: { groupId }, type: QueryTypes.SELECT }
    );

    // Events count per group id (TODO: currently we dont keep which event belong to which group directly)
    // const eventsCount = await sequelize.query(
    //   `SELECT COUNT(*) as count FROM "${getSchema()}".events WHERE site_id IN (SELECT id FROM "${getSchema()}".sites WHERE group_id = :groupId)`,
    //   { replacements: { groupId }, type: QueryTypes.SELECT }
    // );

    // Helper function to extract count from query result
    const getCount = (result: any[]) => parseInt(result[0]?.count || 0);

    // Fetch data from Google Spreadsheet
    let spreadsheetData: any = null;
    const spreadsheetId = process.env.GROUP_STATS_SPREADSHEET;

    if (spreadsheetId) {
      try {
        const googleSheet = new GoogleSpreadsheet();

        // Fetch group info from first sheet
        const groupInfoResult = await googleSheet.getRowByColumnValue(
          spreadsheetId,
          'Dashboard Data',  // Main sheet with group info
          'Group ID',
          groupId.toString()
        );

        // Fetch visits data
        const visitsDataResult = await googleSheet.getSpreadsheetData(
          spreadsheetId,
          'Visits Data'
        );

        // Fetch events data
        const eventsDataResult = await googleSheet.getSpreadsheetData(
          spreadsheetId,
          'Events Data'
        );

        // Helper function to get cell value by header name
        const getCellByHeader = (headers: string[], rowData: any[], headerName: string): string | null => {
          const index = headers.findIndex(h => h.trim().toLowerCase() === headerName.trim().toLowerCase());
          return index !== -1 ? (rowData[index] || null) : null;
        };

        // Parse the spreadsheet data from Dashboard Data sheet
        if (groupInfoResult) {
          const rowData = groupInfoResult.rowData;

          // First, get all headers from the sheet
          const sheetDataResult = await googleSheet.getSpreadsheetData(spreadsheetId, 'Dashboard Data');
          const headers = sheetDataResult?.data?.values?.[0] || [];

          const groupIdVal = getCellByHeader(headers, rowData, 'Group ID');
          const groupNameVal = getCellByHeader(headers, rowData, 'Group Name');
          const acresVal = getCellByHeader(headers, rowData, 'Acres of Land');
          const yearsVal = getCellByHeader(headers, rowData, 'Years of Partnership');
          const visitsVal = getCellByHeader(headers, rowData, 'No. of Visits');
          const treesVal = getCellByHeader(headers, rowData, 'Trees planted');
          const grovesVal = getCellByHeader(headers, rowData, 'Groves');
          const eventsVal = getCellByHeader(headers, rowData, 'Events');
          const giftCardsVal = getCellByHeader(headers, rowData, 'Gift Cards');

          spreadsheetData = {
            group_info: {
              group_id: groupIdVal,
              group_name: groupNameVal,
              acres_of_land: acresVal ? parseFloat(acresVal) : null,
              years_of_partnership: yearsVal ? parseInt(yearsVal) : null,
              no_of_visits: visitsVal ? parseInt(visitsVal) : null,
              trees_planted: treesVal ? parseInt(treesVal) : null,
              groves: grovesVal,
              events: eventsVal ? parseInt(eventsVal) : null,
              gift_cards: giftCardsVal ? parseInt(giftCardsVal) : null,
            }
          };
        }

        // Parse visits data - filter by group_id
        // Expected headers: Group ID, Visit Name, Date, Photo Album Link
        if (visitsDataResult?.data?.values) {
          const visitsRows = visitsDataResult.data.values;
          if (visitsRows.length > 0) {
            const visitsHeaders = visitsRows[0];
            const groupIdColIndex = visitsHeaders.findIndex((h: string) =>
              h.trim().toLowerCase() === 'group id'
            );

            if (groupIdColIndex !== -1) {
              const groupVisits = visitsRows.slice(1).filter((row: any[]) =>
                row[groupIdColIndex]?.toString() === groupId.toString()
              );

              spreadsheetData = {
                ...spreadsheetData,
                visits_data: groupVisits.map((row: any[]) => ({
                  group_id: getCellByHeader(visitsHeaders, row, 'Group ID'),
                  visit_name: getCellByHeader(visitsHeaders, row, 'Visit Name'),
                  date: getCellByHeader(visitsHeaders, row, 'Date'),
                  photo_album_link: getCellByHeader(visitsHeaders, row, 'Photo Album Link'),
                }))
              };
            }
          }
        }

        // Parse events data - filter by group_id
        // Expected headers: Group ID, Event Name, Date, Photo Album Link
        if (eventsDataResult?.data?.values) {
          const eventsRows = eventsDataResult.data.values;
          if (eventsRows.length > 0) {
            const eventsHeaders = eventsRows[0];
            const groupIdColIndex = eventsHeaders.findIndex((h: string) =>
              h.trim().toLowerCase() === 'group id'
            );

            if (groupIdColIndex !== -1) {
              const groupEvents = eventsRows.slice(1).filter((row: any[]) =>
                row[groupIdColIndex]?.toString() === groupId.toString()
              );

              spreadsheetData = {
                ...spreadsheetData,
                events_data: groupEvents.map((row: any[]) => ({
                  group_id: getCellByHeader(eventsHeaders, row, 'Group ID'),
                  event_name: getCellByHeader(eventsHeaders, row, 'Event Name'),
                  date: getCellByHeader(eventsHeaders, row, 'Date'),
                  photo_album_link: getCellByHeader(eventsHeaders, row, 'Photo Album Link'),
                }))
              };
            }
          }
        }
      } catch (error: any) {
        console.log("[WARN]", "TreesController::getCountSummaryForGroup::GoogleSheets", error.message);
        // Continue without spreadsheet data
      }
    } else {
      console.log("[WARN]", "TreesController::getCountSummaryForGroup", "GROUP_STATS_SPREADSHEET environment variable not set");
    }

    res.status(status.success).send({
      // Tree relationships
      trees: {
        mapped_trees: mappedTreesCount,
        sponsored_trees: sponsoredTreesCount,
        gifted_trees: giftedByTreesCount
      },
      // Gift card requests
      gift_card_requests: {
        for_group: getCount(giftRequestsForGroupCount)
      },
      // Donations
      donations: {
        for_group: getCount(donationsForGroupCount)
      },
      // Other relationships
      group_members: getCount(groupMembersCount),
      // events: getCount(eventsCount),

      // Summary totals
      // total_relationships:
      //   mappedTreesCount + sponsoredTreesCount + giftedByTreesCount +
      //   getCount(giftRequestsForGroupCount) +
      //   getCount(donationsForGroupCount) +
      //   getCount(groupMembersCount) +
      //   getCount(eventsCount),

      // Google Spreadsheet data
      spreadsheet_data: spreadsheetData
    });
  } catch (error: any) {
    console.log("[ERROR]", "TreesController::getCountSummaryForGroup", error);
    res.status(status.error).json({
      status: status.error,
      message: 'Something went wrong. Please try again after some time.',
    });
  }
}

export const getMappedTreesForUser = async (req: Request, res: Response) => {
  const { offset, limit } = getOffsetAndLimitFromRequest(req);
  const { user_id } = req.params;
  const userId = parseInt(user_id);

  if (isNaN(userId)) {
    res.status(status.bad).json({
      status: status.bad,
      message: "Invalid User!",
    })
    return;
  }

  try {
    const trees = await TreeRepository.getTrees(offset, limit, [{ operatorValue: 'equals', value: userId, columnField: 'sponsored_by_user' }, { operatorValue: 'isNotEmpty', value: userId, columnField: 'assigned_to' }]);
    res.status(status.success).send(trees);
  } catch (error: any) {
    console.log("[ERROR]", "TreesController::getMappedTreesForUser", error);
    res.status(status.error).json({
      status: status.error,
      message: 'Something went wrong. Please try again after some time.',
    });
  }

}

export const getMappedTreesForGroup = async (req: Request, res: Response) => {
  const { offset, limit } = getOffsetAndLimitFromRequest(req);
  const { group_id } = req.params;
  const groupId = parseInt(group_id);
  console.log("groupId:", groupId);

  if (isNaN(groupId)) {
    return res.status(status.bad).json({
      status: status.bad,
      message: "Invalid Group!",
    });
  }

  try {
    const group = await GroupRepository.getGroup(groupId);
    if (!group) {
      return res.status(status.notfound).json({
        status: status.notfound,
        message: "Group not found.",
      });
    }

    const trees = await TreeRepository.getTrees(offset, limit, [
      { operatorValue: 'equals', value: groupId, columnField: 'sponsored_by_group' },
      { operatorValue: 'isNotEmpty', value: groupId, columnField: 'assigned_to' }
    ]);

    console.log("Filter applied:", [
      { operatorValue: 'equals', value: groupId, columnField: 'sponsored_by_group' },
    ])

    return res.status(status.success).json({
      group_name: group.name,
      ...trees
    });

  } catch (error: any) {
    console.error("[ERROR] TreesController::getMappedTreesForGroup", error);
    return res.status(status.error).json({
      status: status.error,
      message: "Something went wrong. Please try again later.",
    });
  }
};


export const treePlantedByCorporate = async (req: Request, res: Response) => {
  const group_id: string = req.query?.group_id as string;
  let groupId: number | undefined = undefined;
  if (!isNaN(parseInt(group_id))) groupId = parseInt(group_id);

  try {
    const query = `SELECT DATE_TRUNC('year', t.mapped_at) AS year, COUNT(t.id) AS tree_count
                    FROM "${getSchema()}".trees AS t
                    WHERE ${groupId ? `t.mapped_to_group = ${groupId}` : `t.mapped_to_group IS NOT NULL`}
                    GROUP BY year
                    ORDER BY year ASC;
        `
    let result: any[] = await sequelize.query(query, {
      type: QueryTypes.SELECT
    })

    result.forEach(item => {
      item.tree_count = parseInt(item.tree_count);
      const year: Date = item.year;
      item.year = year ? year.getFullYear() : 'Unknown';
    })
    res.status(status.success).send(result);

  } catch (error: any) {
    res.status(status.error).json({
      status: status.error,
      message: error.message,
    });
  }
}

export const getMappedGiftTrees = async (req: Request, res: Response) => {

  const { offset, limit } = getOffsetAndLimitFromRequest(req);
  const { group_id, user_id, filters } = req.body;
  if (!group_id && !user_id) {
    res.status(status.bad).send({ message: "Invalid request! Corporate id or user id required." });
    return;
  }

  try {
    const treesData = await TreeRepository.getMappedGiftTrees(offset, limit, user_id, group_id, filters);
    res.status(status.success).send(treesData);
  } catch (error: any) {
    console.log("[ERROR]", "TreesController::getMappedGiftTrees", error);
    res.status(status.error).send({ message: "Something went wrong. Please try again later!" })
  }
}

export const getMappedGiftTreesAnalytics = async (req: Request, res: Response) => {

  const { group_id, user_id } = req.body;
  if (!group_id && !user_id) {
    res.status(status.bad).send({ message: "Invalid request! Corporate id or user id required." });
    return;
  }

  try {
    const treesData = await TreeRepository.getMappedGiftTreesAnalytics(group_id, user_id);
    res.status(status.success).send(treesData);
  } catch (error: any) {
    console.log("[ERROR]", "TreesController::getMappedGiftTreesAnalytics", error);
    res.status(status.error).send({ message: "Something went wrong. Please try again later!" })
  }
}

export const getMappedDonationTreesAnalytics = async (req: Request, res: Response) => {
  const { group_id, user_id } = req.body;
  if (!group_id && !user_id) {
    res.status(status.bad).send({ message: "Invalid request! Corporate id or user id required." });
    return;
  }

  try {
    const treesData = await TreeRepository.getMappedDonationTreesAnalytics(group_id, user_id);
    res.status(status.success).send(treesData);
  } catch (error: any) {
    console.log("[ERROR]", "TreesController::getMappedDonationTreesAnalytics", error);
    res.status(status.error).send({ message: "Something went wrong. Please try again later!" })
  }
}