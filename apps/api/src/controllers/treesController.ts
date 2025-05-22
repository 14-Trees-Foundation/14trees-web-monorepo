
import { Request, Response } from "express";
import { status } from "../helpers/status";
import TreeRepository from "../repo/treeRepo";
import { getOffsetAndLimitFromRequest } from "./helper/request";
import { Op, QueryTypes, WhereOptions } from "sequelize";
import { sequelize } from "../config/postgreDB";
import { FilterItem } from "../models/pagination";
import { Tree } from "../models/tree";
import { SortOrder } from "../models/common";
import { GroupRepository } from "../repo/groupRepo";

/*
  Model - Tree
  CRUD Operations for trees collection
*/


export const addTree = async (req: Request, res: Response) => {
  try {
    let tree = await TreeRepository.addTree(req.body);
    res.status(status.created).send(tree);
  } catch (error: any) {
    console.log("Tree add error : ", JSON.stringify(error));
    res.status(status.error).send({
      error: error,
    });
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
    res.status(status.error).json({
      status: status.error,
      message: error.message,
    });
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
    res.status(status.error).json({
      status: status.error,
      message: error.message,
    });
  }
};

export const updateTree = async (req: Request, res: Response) => {
  try {
    const tree = await TreeRepository.updateTree(req.body, Array.isArray(req.files) ? req.files : [])
    res.status(status.success).json(tree);
  } catch (error: any) {
    console.error("Tree update error:", error);
    res.status(status.error).send({ error: error.message });
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
    console.log("[ERROR]", "TreesController::changeTreesPlot", error);
    res.status(status.error).send({ error: 'Something went wrong. Please try again after some time.' });
  }
};

export const deleteTree = async (req: Request, res: Response) => {
  try {
    const resp = await TreeRepository.deleteTree(req.params.id);
    console.log("Deleted tree with the id:", req.params.id, resp);
    res.status(status.success).send({ message: "Tree deleted successfully" });
  } catch (error: any) {
    console.error("Tree delete error:", error);
    res.status(status.error).send({ error: error.message });
  }
};

export const getTreeTags = async (req: Request, res: Response) => {
  try {
    const response = await TreeRepository.getTreeTags(0, 100);
    res.status(status.success).send(response);
  } catch (error: any) {
    console.log("[ERROR]", "TreeController::getTreeTags", error);
    res.status(status.error).send({ message: "Something went wrong. Please try again after some time" });
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
    res.status(status.error).json({
      status: status.error,
      message: error.message,
    });
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
    console.log(result);
    res.status(status.success).send(result);
  } catch (error: any) {
    res.status(status.error).json({
      status: status.error,
      message: error.message,
    });
  }
};

export const treeLoggedByDate = async (req: Request, res: Response) => {
  const { offset, limit } = getOffsetAndLimitFromRequest(req);
  try {
    const query = `SELECT DATE(t.created_at) AS "_id", COUNT(t.id)
                        FROM "14trees_2".trees AS t
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
    const mappedTrees: WhereOptions<Tree> = { mapped_to_user: userId }
    const mappedTreesCount = await TreeRepository.treesCount(mappedTrees);

    const assignedTrees: WhereOptions<Tree> = { assigned_to: userId }
    const assignedTreesCount = await TreeRepository.treesCount(assignedTrees);

    const giftedTrees: WhereOptions<Tree> = { gifted_to: userId }
    const giftedTreesCount = await TreeRepository.treesCount(giftedTrees);

    res.status(status.success).send({
      mapped_trees: mappedTreesCount,
      assigned_trees: assignedTreesCount,
      gifted_trees: giftedTreesCount
    });
  } catch (error: any) {
    console.log("[ERROR]", "TreesController::getTreesCountForUser", error);
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
      { operatorValue: 'isNotEmpty', value: groupId,  columnField: 'assigned_to' }
    ]);

    console.log("Filter applied:", [
      { operatorValue: 'equals', value: groupId, columnField: 'sponsored_by_group' },
    ])

    return res.status(status.success).json({
      group_name: group.name,
      results: trees,
      total: trees.total,
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
                    FROM "14trees_2".trees AS t
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