import { Request, Response } from "express";
import { getOffsetAndLimitFromRequest } from "./helper/request";
import { UserTreeRepository } from "../repo/userTreeRepo";
import TreeRepository from "../repo/treeRepo";
import { Event, EventCreationAttributes } from "../models/events";
import EventRepository from "../repo/eventsRepo";
import { PlotRepository } from "../repo/plotRepo";
import { FilterItem } from "../models/pagination";
import { DonationUserRepository } from "../repo/donationUsersRepo";
import { Op } from "sequelize";
import { DonationRepository } from "../repo/donationsRepo";
import { UserRepository } from "../repo/userRepo";
import { status } from "../helpers/status";

export const getAllProfile = async (req: Request, res: Response) => {
  const { offset, limit } = getOffsetAndLimitFromRequest(req);
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

export const getUserProfile = async (req: Request, res: Response) => {
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

export const getProfile = async (req: Request, res: Response) => {
  if (!req.query.id) {
    res.status(status.bad).send({ error: "Sapling ID required" });
    return;
  }

  try {
    let userTrees: any[] = [];
    const tree = await TreeRepository.getTreeBySaplingId(req.query.id.toString())
    if (tree && tree.assigned_to) {
      userTrees = await TreeRepository.getUserProfilesForUserId(tree.assigned_to);
    }
    res.status(status.success).json({ user_trees: userTrees });
  } catch (error: any) {
    res.status(status.bad).send({ message: error.message });
    return;
  }
};

export const getProfileById = async (req: Request, res: Response) => {
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

export const assignTreeToUser = async (req: Request, res: Response) => {
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

export const assignTreesToUser = async (req: Request, res: Response) => {
  const fields = req.body;
  let event: Event | undefined;
  try {
    if (fields.type && fields.type != "") {
      const data: EventCreationAttributes = {
        name: fields.description,
        type: fields.type,
        assigned_by: fields.sponsored_by_user,
        site_id: fields.site_id,
        description: fields.description,
        tags: fields.tags,
        event_date: fields.event_date ?? new Date(),
        event_location: fields.event_location ?? 'onsite',
      }
      event = await EventRepository.addEvent(data);
    }

    let saplingIds: string[] = fields.sapling_ids.split(",");
    saplingIds = saplingIds.map((saplingId: string) => {
      return saplingId.trim();
    })
    let trees = [];
    for (let i = 0; i < saplingIds.length; i++) {
      const result = await TreeRepository.assignTree(saplingIds[i], fields, event?.id);
      trees.push(result);
    }
    res.status(status.created).json(trees);
  } catch (error: any) {
    res.status(status.error).send({ error: error.message });
    return;
  }
};

export const unassignTrees = async (req: Request, res: Response) => {
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

export const update = async (req: Request, res: Response) => {
  res.status(status.bad).json();
};

export const assignTreesBulk = async (req: Request, res: Response) => {

  const donationId = req.params.donation_id
  const donationResp = await DonationRepository.getDonations(0, 1, { id: donationId })
  const donation = donationResp.results[0];
  console.log('donation:', donation);

  const tags: string[] = donation.associated_tag ? [donation.associated_tag] : [];
  const plotsFilter: FilterItem[] = [{ columnField: 'tags', operatorValue: 'isAnyOf', value: tags }]
  const plotResp = await PlotRepository.getPlots(0, -1, plotsFilter)
  const plotIds = plotResp.results.map(plot => plot.id);
  console.log('plot:', plotIds);

  const user = await UserRepository.getUser(donation.name, donation.email_address);
  if (!user) {
    res.status(status.error).send();
    return;
  }

  console.log('Donor', user);
  const success = await assignTrees(donation.id, user.id, parseInt(donation.pledged), plotIds);

  if (success) {
    res.status(status.success).send();
    return;
  } else {
    res.status(status.error).send();
    return;
  }
}

const assignTrees = async (donationId: number, userId: number, totalTrees: number, plotIds: number[]) => {

  try {
    const whereClause = {
      donation_id: donationId,
      assigned_to: { [Op.not]: null },
    }
    let assignedTreesCount = await TreeRepository.treesCount(whereClause);

    // get users
    const donationUsers: any[] = await DonationUserRepository.getDonationUsers(donationId);
    console.log('Donation users:', donationUsers)
    for (const user of donationUsers) {
      const remainingAssignCount = user.gifted_trees - user.assigned_trees;
      if (remainingAssignCount <= 0) return; // user condition satisfied (trees assigned)

      const count = Math.min(totalTrees - assignedTreesCount, remainingAssignCount);
      if (count <= 0) break; // donation condition satisfied (trees assigned)

      const assignedCount = await assignTreesToDonationUser(donationId, userId, user.user_id, count, plotIds);
      assignedTreesCount += assignedCount;

      if (assignedCount !== count) break; // not enough trees
    }

    return true;
  } catch (error: any) {
    console.log('[ERROR]', "assignTreesBulk", error.message);
    return false;
  }

}

const assignTreesToDonationUser = async (donationId: number, donorId: number, userId: number, count: number, plotIds: number[]) => {

  // fetch trees
  const filters: FilterItem[] = [
    { columnField: 'mapped_to_user', operatorValue: 'isEmpty', value: '' },
    { columnField: 'mapped_to_group', operatorValue: 'isEmpty', value: '' },
    { columnField: 'assigned_to', operatorValue: 'isEmpty', value: '' },
    { columnField: 'plot_id', operatorValue: 'isAnyOf', value: plotIds },
  ]
  const resp = await TreeRepository.getTrees(0, count, filters);
  const treeIds = resp.results.map(tree => tree.id);
  const updateRequest: any = {
    mapped_to_user: donorId,
    sponsored_by_user: donorId,
    mapped_at: new Date(),
    assigned_at: new Date(),
    assigned_to: userId,
    gifted_to: userId,
    donation_id: donationId,
  }
  
  const updatedCount = await TreeRepository.updateTrees(updateRequest, { id: { [Op.in]: treeIds }})
  return updatedCount;
}