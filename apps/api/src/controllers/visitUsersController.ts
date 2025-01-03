import { status } from "../helpers/status";
import { VisitUsersRepository } from "../repo/visitUsersRepo";
import { Request, Response } from "express";
import { UserRepository } from "../repo/userRepo";
import { User, UserCreationAttributes } from "../models/user";
import { validateCSV } from "./helper/parsecsv";
import { VisitUsersCreationAttributes } from "../models/visit_users";
import { VisitRepository} from "../repo/visitsRepo"
import { getOffsetAndLimitFromRequest } from "./helper/request";
import { FilterItem } from "../models/pagination";

/*
    Model - VisitUserGroup
    CRUD Operations for visit_user_group table
*/

export const getVisitUsers = async (req: Request, res: Response) => {
  const visitId: number = parseInt(req.query.visit_id as string);

  try {
    const {offset, limit } = getOffsetAndLimitFromRequest(req);
    const filters: FilterItem[] = req.body?.filters;
    
    let users = await VisitUsersRepository.getVisitUsers(visitId, offset, limit, filters);
    res.status(status.success).json(users);
  } catch (error: any) {
    res.status(status.error).send({ error: error.message });
    return;
  }
}

export const addVisitUsers = async (req: Request, res: Response) => {

  if (!req.body.visit_id) {
      res.status(status.bad).send({ error: "Visit Id is required" });
      return;
  }
  if (!req.body.user_id && (!req.body.name || !req.body.email || !req.body.phone)) {
      res.status(status.bad).send({ error: "user_id or new user details are required" });
      return;
  }
  
  try {
      let userId = req.body.user_id;
      let visitId = req.body.visit_id;
      if (userId) {
        // TODO: change below implementation
          let visituserGroup = await VisitUsersRepository.getVisitUsers(visitId,0,1000,[]);
          if (visituserGroup.total !== 0) {
              res.status(status.duplicate).send({ "message": "User is already part of the Visit" });
              return;
          }
      } else {
          let user = await UserRepository.upsertUser(req.body);
          userId = user.id;
      }

      const responseData = await VisitUsersRepository.addUser(userId, visitId);
      res.status(status.created).send(responseData);
  } catch (error) {
      res.status(status.bad).json({
          error: error,
      });
  }
}


export const deleteVisitUsers = async (req: Request, res: Response) => {
  try {
      const { user_ids, visit_id } = req.body
      if (!user_ids || !visit_id) {
          res.status(status.bad).send({ error: "user_ids and group_id are required" });
          return;
      }
      let resp = await VisitUsersRepository.deleteVisitUsers(user_ids, visit_id);
      console.log("Delete user group response for user_ids: %s and visit_id: %s", user_ids, visit_id, resp);
      res.status(status.success).json({
        message: "Visit Group users deleted successfully",
      });
  } catch (error: any) {
      res.status(status.bad).send({ error: error.message });
  }
}

export const addVisitUsersBulk = async (req: Request, res: Response) => {

  try {
    if (!req.file) {
      throw new Error('No file uploaded. Bulk operation requires data as csv file.');
    }
    if (!req.body.visit_id || isNaN(parseInt(req.body.visit_id))) {
      throw new Error('Visit id is required');
    }

    const visitId = parseInt(req.body.visit_id);
    const { path } = req.file
    const data = await validateCSV<UserCreationAttributes>(path);

    const visit = await VisitRepository.getVisit(visitId);
    if (!visit) {
      res.status(404).json({ error: 'Visit not found' });
      return;
    }

    let users: User[] = [];
    for (const row of data.valid_records) {
      try {
          const resp = await UserRepository.getUsers(0, 1, [{ columnField: 'email', value: row.email, operatorValue: 'equals' }]);
          if (resp.results.length > 0) {
              users.push(resp.results[0]);
          } else {
              const user = await UserRepository.addUser(row);
              users.push(user);
          }
      } catch (error: any) {
        console.error('Error creating user for visit-user group', error);
        let error_record = { ...row, error: "Failed to create user", status: "error" };
        data.invalid_records.push(error_record);
      }
    }
    const userIds = users.map(user => user.id);

    const visituserGroups = await VisitUsersRepository.bulkAddVisitUsers(userIds, visit.id);
    res.status(201).json({ success: visituserGroups.length, failed: data.invalid_records.length, failed_records: data.invalid_records });

  } catch (error:any) {
    console.error('Error processing CSV:', error);
    res.status(500).json({ error: error.message });
  }
};