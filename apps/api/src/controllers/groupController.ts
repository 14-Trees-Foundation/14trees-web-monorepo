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


/*
    Model - Group
    CRUD Operations for groups table
*/

export const getGroups = async (req: Request, res: Response) => {
    const { offset, limit } = getOffsetAndLimitFromRequest(req);
    const filters: FilterItem[] = req.body?.filters;
    let whereClause = {};
    if (filters && filters.length > 0) {
        filters.forEach(filter => {
            whereClause = { ...whereClause, ...getWhereOptions(filter.columnField, filter.operatorValue, filter.value) }
        })
    }

    try {
        let result = await GroupRepository.getGroups(offset, limit, whereClause);
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
    let whereClause = getWhereOptions("name", "contains", searchStr);

    try {
        let result = await GroupRepository.getGroups(offset, limit, whereClause);
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

        // Update trees
        const mappedTrees = { mapped_to_group: primary_group, updated_at: new Date() };
        await TreeRepository.updateTrees(mappedTrees, { mapped_to_group: secondary_group });

        const sponsoredTrees = { sponsored_by_group: primary_group, updated_at: new Date() };
        await TreeRepository.updateTrees(sponsoredTrees, { sponsored_by_group: secondary_group });

        // gift requests
        const giftRequests = { group_id: primary_group, updated_at: new Date() };
        await GiftCardsRepository.updateGiftCardRequests(giftRequests, { group_id: secondary_group });

        // user groups
        await UserGroupRepository.changeGroup(primary_group, secondary_group);

        // visit
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