import { status } from "../helpers/status";
import { GroupRepository } from "../repo/groupRepo";
import { getOffsetAndLimitFromRequest } from "./helper/request";
import { Request, Response } from "express";
  

/*
    Model - Group
    CRUD Operations for groups table
*/

export const getGroups = async (req: Request, res: Response) => {
    const {offset, limit } = getOffsetAndLimitFromRequest(req);
    try {
        let result = await GroupRepository.getGroups(req.query, offset, limit);
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
        const org = await GroupRepository.addGroup(req.body);
        res.status(status.created).send(org);
    } catch (error) {
        res.status(status.bad).json({
            error: error,
        });
    }
}


export const updateGroup = async (req: Request, res: Response) => {
    try {
        let result = await GroupRepository.updateGroup(req.body)
        res.status(status.created).json(result);
    } catch (error) {
        console.log(error)
        res.status(status.error).json({ error: error });
    }
}


export const deleteGroup = async (req: Request, res: Response) => {
    try {
        let resp = await GroupRepository.deleteGroup(req.params.id);
        console.log("Delete group response for id: %s", req.params.id, resp);
        res.status(status.success).json({
          message: "Group deleted successfully",
        });
    } catch (error: any) {
        res.status(status.bad).send({ error: error.message });
    }
}