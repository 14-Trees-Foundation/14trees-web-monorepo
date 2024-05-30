import { status } from "../helpers/status";
import { UserGroupRepository } from "../repo/userGroupRepo";
import { getOffsetAndLimitFromRequest } from "./helper/request";
import { Request, Response } from "express";
  

/*
    Model - UserGroup
    CRUD Operations for user groups table
*/

export const getUserGroups = async (req: Request, res: Response) => {
    const {offset, limit } = getOffsetAndLimitFromRequest(req);
    try {
        let result = await UserGroupRepository.getUserGroups(offset, limit);
        res.status(status.success).send(result);
    } catch (error: any) {
        res.status(status.error).json({
            status: status.error,
            message: error.message,
        });
    }
}

export const addUserGroup = async (req: Request, res: Response) => {

    if (!req.body.user_id) {
        res.status(status.bad).send({ error: "user_id is required" });
        return;
    }
    if (!req.body.group_id) {
        res.status(status.bad).send({ error: "group_id is required" });
        return;
    }
    try {
        const org = await UserGroupRepository.addUserGroup(req.body);
        res.status(status.created).send(org);
    } catch (error) {
        res.status(status.bad).json({
            error: error,
        });
    }
}


// export const updateUserGroup = async (req: Request, res: Response) => {
//     try {
//         let result = await UserGroupRepository.updateUserGroup(req.body)
//         res.status(status.created).json(result);
//     } catch (error) {
//         console.log(error)
//         res.status(status.error).json({ error: error });
//     }
// }


export const deleteUserGroup = async (req: Request, res: Response) => {
    try {
        let resp = await UserGroupRepository.deleteUserGroup(req.params.user_id, req.params.group_id);
        console.log("Delete user group response for id: %s %s", req.params.user_id, req.params.group_id, resp);
        res.status(status.success).json({
          message: "UserGroup deleted successfully",
        });
    } catch (error: any) {
        res.status(status.bad).send({ error: error.message });
    }
}