import { Request, Response } from "express";
import TreeRepository from "../repo/treeRepo";
import { UserRepository } from "../repo/userRepo";
import { GroupRepository } from "../repo/groupRepo";
import { User } from "../models/user";
import { Group } from "../models/group";
import { GiftCardsRepository } from "../repo/giftCardsRepo";
import { Op } from "sequelize";
import { UserGroupRepository } from "../repo/userGroupRepo";

const { status } = require("../helpers/status");
const { getOffsetAndLimitFromRequest } = require("./helper/request");
const { getWhereOptions } = require("./helper/filters");

export const getMappedTrees = async (req: Request, res: Response) => {
  const { offset, limit } = getOffsetAndLimitFromRequest(req);
  let email = req.params["email"];
  try {
    const { trees, user } = await TreeRepository.getMappedTrees(email, offset, limit);
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

export const getMappedTreesForGroup = async (req: Request, res: Response) => {
  const { offset, limit } = getOffsetAndLimitFromRequest(req);
  let groupId = req.params["group_id"];
  try {
    const { trees } = await TreeRepository.getMappedTreesForGroup(parseInt(groupId), offset, limit);
    res.status(status.success).send({
      trees: trees,
    });
  } catch (error: any) {
    res.status(status.error).json({
      status: status.error,
      message: error.message,
    });
  }
};

export const upsertUserAndGroup = async (mappedTo: "user" | "group", id: number, sponsorId: number | null, fields: any) => {
  let data = { id: id, sponsorId: sponsorId as number | null };
  if (mappedTo === "user") {
    let userResp = await UserRepository.getUsers(0, 1, [{ columnField: "id", operatorValue: "equals", value: id }]);
    if (userResp.results.length === 0) {
      if (!fields.name || !fields.email) {
        throw new Error("name and email are required");
      } else {
        const user = await UserRepository.upsertUser(fields);
        data.id = user.id;
      }
    }

    if (!fields.same_sponsor) {
      let sponsor: User | null = null;
      if (sponsorId) {
        let sponsorResp = await UserRepository.getUsers(0, 1, [{ columnField: "id", operatorValue: "equals", value: sponsorId }]);
        if (sponsorResp.results.length === 1) sponsor = sponsorResp.results[0];
      }

      if (!sponsor) {
        if (!fields.sponsor_name || !fields.sponsor_email) {
          data.sponsorId = null;
        } else {
          const user = await UserRepository.upsertUser({ name: fields.sponsor_name, email: fields.sponsor_email, phone: fields.sponsor_phone });
          data.sponsorId = user.id;
        }
      }
    }
  } else {
    let group = await GroupRepository.getGroup(id);
    if (group === null) {
      if (!fields.name || !fields.type) {
        throw new Error("group name and type are required");
      } else {
        const group = await GroupRepository.addGroup(fields);
        data.id = group.id;
      }
    }

    if (!fields.same_sponsor) {
      let sponsor: Group | null = null;
      if (sponsorId) {
        sponsor = await GroupRepository.getGroup(sponsorId);
      }
      if (sponsor === null) {
        if (!fields.sponsor_name || !fields.sponsor_type) {
          data.sponsorId = null;
        } else {
          const group = await GroupRepository.addGroup({ name: fields.sponsor_name, type: fields.sponsor_type, description: fields.sponsor_description });
          data.sponsorId = group.id;
        }
      }
    }
  }

  if (fields.same_sponsor) data.sponsorId = data.id;
  return data;
}

export const mapTrees = async (req: Request, res: Response) => {
  const fields = req.body;
  let id = fields.id;
  let sponsorId = fields.sponsorId;
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
    const data = await upsertUserAndGroup(mapped_to, id, sponsorId, fields);

    // if user then add user to donor group
    if (mapped_to === 'user') await UserGroupRepository.addUserToDonorGroup(data.sponsorId ? data.sponsorId : data.id);

    await TreeRepository.mapTrees(mapped_to, saplingIds, data.id, data.sponsorId);
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
  let sponsorId = fields.sponsor_id;
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
    const data = await upsertUserAndGroup(mapped_to, id, sponsorId, fields);

    // if user then add user to donor group
    if (mapped_to === 'user') await UserGroupRepository.addUserToDonorGroup(data.sponsorId ? data.sponsorId : data.id);

    await TreeRepository.mapTreesInPlot(mapped_to, data.id, [Number(plotId)], count, data.sponsorId);
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

    // if user then add user to donor group
    if (mapped_to === 'user') await UserGroupRepository.addUserToDonorGroup(id);

    await TreeRepository.mapTreesInPlot(mapped_to, id, plotIds, count, id);
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

  const trees = await TreeRepository.getTrees(0, -1, [{ columnField: "sapling_id", operatorValue: "isAnyOf", value: saplingIds }]);
  const treeIds = trees.results.map((tree) => tree.id);

  const cards = await GiftCardsRepository.getGiftCards(0, -1, { tree_id: {[Op.in]: treeIds} })
  if (cards.results.length > 0) {
    res.status(status.bad).send({
      message: "Some trees are part of gift requests",
    })
    return;
  }

  await TreeRepository.unMapTrees(saplingIds);
  res.status(status.created).send();
};


export const getUserMappedTreesCount = async (req: Request, res: Response) => {
  const { offset, limit } = getOffsetAndLimitFromRequest(req);
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
