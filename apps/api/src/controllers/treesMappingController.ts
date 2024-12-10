import { Request, Response } from "express";
import TreeRepository from "../repo/treeRepo";
import { UserRepository } from "../repo/userRepo";
import { GroupRepository } from "../repo/groupRepo";

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
  let id = fields.id;
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
    if (mapped_to === "user") {
      let userResp = await UserRepository.getUsers(0, 1, [{ columnField: "id", operatorValue: "equals", value: id }]);
      if (userResp.results.length === 0) {
        if (!fields.name || !fields.email) {
          throw new Error("name and email are required");
        } else {
          const user = await UserRepository.upsertUser(fields);
          id = user.id;
        }
      }
    } else {
      let group = await GroupRepository.getGroup(id);
      if (group === null) {
        throw new Error("Group with given id not found");
      }
    }
    await TreeRepository.mapTrees(mapped_to, saplingIds, id);
    res.status(status.created).send();
  } catch (error: any) {
    res.status(status.error).send({
      error: error.message,
    });
  }
};

export const mapTreesInPlot = async (req: Request, res: Response) => {
  const fields = req.body;
  let id = fields.id;
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
    if (mapped_to === "user") {
      let userResp = await UserRepository.getUsers(0, 1, [{ columnField: "id", operatorValue: "equals", value: id }]);
      if (userResp.results.length === 0) {
        if (!fields.name || !fields.email) {
          throw new Error("name and email are required");
        } else {
          const user = await UserRepository.upsertUser(fields);
          id = user.id;
        }
      }
    } else {
      let group = await GroupRepository.getGroup(id);
      if (group === null) {
        if (!fields.name || !fields.type) {
          throw new Error("group name and type are required");
        } else {
          const group = await GroupRepository.addGroup(fields);
          id = group.id;
        }
      }
    }
    await TreeRepository.mapTreesInPlot(mapped_to, id, [Number(plotId)], count);
    res.status(status.success).send();
  } catch (error) {
    res.status(status.error).send({
      error: error,
    });
  }
};

export const mapTreesInPlots = async (req: Request, res: Response) => {
  const fields = req.body;
  let id = fields.id;
  const plotIds = fields.plot_ids;
  const count = fields.count;
  const mappingType: string = fields.mapped_to

  if (mappingType !== 'user' && mappingType !== 'group') {
    res.status(status.bad).send({
      error: "Mapped to is required(user/group)",
    })
    return;
  } else if (!id) {
    res.status(status.bad).send({
      error: "user/group Id is required",
    })
    return;
  }

  const mapped_to: 'user' | 'group' = mappingType === 'user' ? 'user' : 'group';
  try {
    await TreeRepository.mapTreesInPlot(mapped_to, id, plotIds, count);
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
