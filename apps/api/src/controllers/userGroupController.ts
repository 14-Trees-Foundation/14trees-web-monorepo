import { status } from "../helpers/status";
import { UserGroupRepository } from "../repo/userGroupRepo";
import { Request, Response } from "express";
import { validateCSV } from "./helper/parsecsv";
import { UserRepository } from "../repo/userRepo";
import { User, UserCreationAttributes } from "../models/user";
import { GroupRepository } from "../repo/groupRepo";
  

/*
    Model - UserGroup
    CRUD Operations for user groups table
*/

export const getUserGroup = async (req: Request, res: Response) => {
    const userId: string = req.query.user_id as string;
    const groupId: string = req.query.group_id as string;
    try {
        let result = await UserGroupRepository.getUserGroup(userId, groupId);
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

export const addUserGroupsBulk = async (req: Request, res: Response) => {

    try {
      if (!req.file) {
        throw new Error('No file uploaded. Bulk operation requires data as csv file.');
      }
      if (!req.body.group_id || isNaN(parseInt(req.body.group_id))) {
        throw new Error('Group id is required');
      }

      const groupId = parseInt(req.body.group_id);
      const { path } = req.file
      const data = await validateCSV<UserCreationAttributes>(path);

      const group = await GroupRepository.getGroup(groupId);
      if (!group) {
        res.status(404).json({ error: 'Group not found' });
        return;
      }

      let users: User[] = [];
      for (const row of data.valid_records) {
        try {
            const resp = await UserRepository.getUsers(0, 1, { email: row.email });
            if (resp.results.length > 0) {
                users.push(resp.results[0]);
            } else {
                const user = await UserRepository.addUser(row);
                users.push(user);
            }
        } catch (error: any) {
          console.error('Error creating user for user group', error);
          let error_record = { ...row, error: "Failed to create user", status: "error" };
          data.invalid_records.push(error_record);
        }
      }
      const userIds = users.map(user => user.id);

      const userGroups = await UserGroupRepository.bulkAddUserGroups(userIds, group.id);
      res.status(201).json({ success: userGroups.length, failed: data.invalid_records.length, failed_records: data.invalid_records });

    } catch (error:any) {
      console.error('Error processing CSV:', error);
      res.status(500).json({ error: error.message });
    }
  };