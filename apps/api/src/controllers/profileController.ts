import { Request, Response } from "express";
import { getOffsetAndLimitFromRequest } from "./helper/request";
import { UserTreeRepository } from "../repo/userTreeRepo";
import TreeRepository from "../repo/treeRepo";

const { status } = require("../helpers/status");

export const getAllProfile = async (req: Request, res: Response) => {
  const {offset, limit } = getOffsetAndLimitFromRequest(req);
  try {
    const profiles = await UserTreeRepository.getAllProfiles(offset, limit);
    res.status(status.success).json({
      result: profiles,
    });
  } catch (error: any) {
    res.status(status.error).json({
      status: status.error,
      message: error.message,
    });
  }
};

export const getUserProfile = async  (req: Request, res: Response) => {
  if (!req.query.userid) {
    res.status(status.bad).send({ error: "User ID required" });
    return;
  }
   
  try {
    const usertrees = await UserTreeRepository.getUserProfile(req.query.userid.toString())
      res.status(status.success).json({
        usertrees: usertrees,
      });
  } catch (error: any) {
      res.status(status.bad).send({ error: error.message });
      return;
  }
};

export const getProfile = async  (req: Request, res: Response) => {
  if (!req.query.id) {
    res.status(status.bad).send({ error: "Sapling ID required" });
    return;
  }

  try {
    const usertrees = await UserTreeRepository.getUserProfileForSamplingId(req.query.id.toString());
    res.status(status.success).json({ ...usertrees});
  } catch (error: any) {
    res.status(status.bad).send({ error: error.message });
    return;
  }
};

export const getProfileById = async  (req: Request, res: Response) => {
  if (!req.query.id) {
    res.status(status.bad).send({ error: "User tree ID required" });
    return;
  }

  try {
    const usertrees = await UserTreeRepository.getUserProfileForSamplingId(req.query.id.toString());
    res.status(status.success).json(usertrees);
  } catch (error: any) {
    res.status(status.bad).send({ error: error.message });
    return;
  }
};

export const assignTreeToUser = async  (req: Request, res: Response) => {
  try {
    let result = await TreeRepository.assignTree(
      req.body.sapling_id,
      req.body
    );
    res.status(status.created).json(result);
  } catch (error: any) {
    res.status(status.error).send({ error: error.message });
    return;
  }
};

export const assignTreesToUser = async  (req: Request, res: Response) => {
  try {
    let saplingIds: string[] = req.body.sapling_ids;
    let trees = [];
    for (let i = 0; i < saplingIds.length; i++) {
      const result = await TreeRepository.assignTree(saplingIds[i], req.body);
      trees.push(result);
    }
    res.status(status.created).json(trees);
  } catch (error: any) {
    res.status(status.error).send({ error: error.message });
    return;
  }
};

export const unassignTrees = async  (req: Request, res: Response) => {
  if (!req.body.sapling_ids && req.body.sapling_ids.length === 0) {
    res.status(status.bad).send({ error: "Sapling IDs required" });
    return;
  }

  try {
    await TreeRepository.unassignTrees(req.body.sapling_ids)
    res.status(status.success).send();
  } catch (error: any) {
    res.status(status.bad).send({ error: error.message });
    return;
  }
}

export const update = async  (req: Request, res: Response) => {
  res.status(status.bad).json();
  // try {
  //   await UserTreeModel.updateMany(
  //     {},
  //     { $set: { orgid: mongoose.Types.ObjectId("617252192793a0a9994b8bb5") } }
  //   );
  // } catch (error: any) {
  //   console.log(error);
  // }
};

/* GraphQL Query for User Tree Reg aggregation
query {
  user_tree_reg(query: { user:{_id:"628fcf2a4e07c243c5bcfc3f"}}) {
    user {
      _id
      name
      email
      userid
    }
    tree {
      _id
      sapling_id
      image
      location {
        coordinates
        type
      }
      tree_id {
        name
        image
        scientific_name
      }
      plot_id
      event_type
      link
      mapped_to
      desc
    }
    orgid
  }
}
*/
