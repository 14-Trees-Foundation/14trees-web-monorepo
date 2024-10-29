
import { Request, Response } from "express";
import { status } from "../helpers/status";
import TreeRepository from "../repo/treeRepo";
import { getOffsetAndLimitFromRequest } from "./helper/request";
import { isArray } from "lodash";
import { Op, QueryTypes } from "sequelize";
import { sequelize } from "../config/postgreDB";
import { FilterItem } from "../models/pagination";

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

  try {
    let result = await TreeRepository.getTrees(offset, limit, filters);
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
    const tree = await TreeRepository.updateTree(req.body, isArray(req.files) ? req.files : [])
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
                        FROM "14trees".trees AS t
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

  try {
    const result = await TreeRepository.getGiftableTrees(offset, limit, filters);
    res.status(status.success).send(result);
  } catch (error: any) {
    console.log("[ERROR]", "TreesController::getGiftableTrees", error);
    res.status(status.error).json({
      status: status.error,
      message: 'Something went wrong. Please try again after some time.',
    });
  }
}