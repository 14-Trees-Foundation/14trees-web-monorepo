import { Request, Response } from "express";
import TreeRepository from "../repo/treeRepo";

const { status } = require("../helpers/status");
const { getOffsetAndLimitFromRequest } = require("./helper/request");
const { getWhereOptions } = require("./helper/filters");

export const getMappedTrees = async (req: Request, res: Response) => {
  const {offset, limit} = getOffsetAndLimitFromRequest(req);
  let email = req.params["email"];
  try {
    const {trees, user} = await TreeRepository.getMappedTrees(email, offset, limit);
    res.status(status.success).send({
      user: user,
      trees: trees,
    });
  } catch (error: any) {
    res.status(status.error).json({
      status: status.error,
      message: error.message,
    });
  }
};

export const mapTrees = async (req: Request, res: Response) => {
  const fields = req.body;
  const id = fields.id;
  let saplingIds = fields.sapling_ids as string[]
  saplingIds = saplingIds.map((saplingId) => saplingId.trim());
  const mappingType: string = fields.mapped_to

  if (mappingType !== 'user' && mappingType !== 'group') {
    res.status(status.bad).send({
      error: "Mapped to is required(user/group)",
    })
    return;
  }

  const mapped_to: 'user' | 'group' = mappingType === 'user' ? 'user' : 'group';
  try {
    await TreeRepository.mapTrees(mapped_to, saplingIds, id);
    res.status(status.created).send();
  } catch (error: any) {
    res.status(status.error).send({
      error: error,
    });
  }
};

export const mapTreesInPlot = async (req: Request, res: Response) => {
  const fields = req.body;
  const id = fields.id;
  const plotId = fields.plot_id;
  const count = fields.count;
  const mappingType: string = fields.mapped_to

  if (mappingType !== 'user' && mappingType !== 'group') {
    res.status(status.bad).send({
      error: "Mapped to is required(user/group)",
    })
    return;
  }

  const mapped_to: 'user' | 'group' = mappingType === 'user' ? 'user' : 'group';
  try {
    await TreeRepository.mapTreesInPlot(mapped_to, id, plotId, count);
    res.status(status.success).send();
  } catch (error) {
    res.status(status.error).send({
      error: error,
    });
  }
};

export const unMapTrees = async (req: Request, res: Response) => {
    const fields = req.body;
    let saplingIds = fields.sapling_ids;

    await TreeRepository.unMapTrees(saplingIds);
    res.status(status.created).send();
};


export const getUserMappedTreesCount = async (req: Request, res: Response) => {
  const {offset, limit} = getOffsetAndLimitFromRequest(req);
  const filterReq = req.body.filters;
  let filters;
  if (filterReq && filterReq.length != 0) {
    if (filterReq[0].columnField === "name") {
      filters = getWhereOptions("user.name", filterReq[0].operatorValue, filterReq[0].value)
    } else if (filterReq[0].columnField === "plot") {
      filters = getWhereOptions("plot.name", filterReq[0].operatorValue, filterReq[0].value)
    }
  }

  try {
    
    let result = await TreeRepository.getUserTreesCount(offset, limit);
    
    res.status(status.success).send(result);
  } catch (error: any) {
    res.status(status.error).json({
      message: error.message,
    });
  }
};
