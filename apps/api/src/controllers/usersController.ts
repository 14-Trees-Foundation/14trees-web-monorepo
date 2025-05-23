import { Request, Response } from "express";
import { status } from "../helpers/status";
import { User } from "../models/user";
import { getOffsetAndLimitFromRequest } from "./helper/request";
import { UserRepository, getUserDocumentFromRequestBody } from "../repo/userRepo";
import csvParser from 'csv-parser';
import { createObjectCsvWriter } from 'csv-writer';
import fs from 'fs';
import { constants } from "../constants";
import { FilterItem } from "../models/pagination";
import TreeRepository from "../repo/treeRepo";
import { UserGroupRepository } from "../repo/userGroupRepo";
import { GiftCardsRepository } from "../repo/giftCardsRepo";
import { UserRelationRepository } from "../repo/userRelationsRepo";
import { VisitRepository } from "../repo/visitsRepo";
import { VisitUsers } from "../models/visit_users";
import { VisitUsersRepository } from "../repo/visitUsersRepo";
import { AlbumRepository } from "../repo/albumRepo";
import EventRepository from "../repo/eventsRepo";

/*
    Model - User
    CRUD Operations for users collection
*/

export const getUser = async (req: Request, res: Response) => {
  try {
    if (!req.query.email || !req.query.name) {
      throw new Error("User name and email are required");
    } 
    
    let user = await UserRepository.getUser(req.query.name.toString(), req.query.email.toString());
    if (user === null) {
      res.status(status.notfound).send();
    } else {
      res.status(status.success).json(user);
    }
  } catch (error: any) {
    res.status(status.bad).send({ error: error.message });
    return;
  }
};

export const getUsers = async (req: Request, res: Response) => {
  try {
    const {offset, limit } = getOffsetAndLimitFromRequest(req);
    const filters: FilterItem[] = req.body?.filters;
    
    let users = await UserRepository.getUsers(offset, limit, filters);
    res.status(status.success).json(users);
  } catch (error: any) {
    res.status(status.error).send({ error: error.message });
    return;
  }
};

export const searchUsers = async (req: Request, res: Response) => {
  try {
    if (!req.params.search || req.params.search.length < 3) {
      res.status(status.bad).send({ error: "Please provide at least 3 char to search"});
      return;
    }

    const { offset, limit } = getOffsetAndLimitFromRequest(req);
    const users = await UserRepository.searchUsers(req.params.search, offset, limit);
    res.status(status.success).send(users);
    return;
  } catch (error:any) {
    res.status(status.bad).send({ error: error.message });
    return;
  }
};

export const addUser = async (req: Request, res: Response) => {
  try {

    // validation logic
    if (!req.body.name) {
      throw new Error("User name is required");
    }
    if (!req.body.email) {
      throw new Error("User email is required");
    }
    
    let userExists = await UserRepository.getUsers(0, 1, [{ columnField: 'email', operatorValue: 'equals', value: req.body.email }]);
    if (userExists.results.length !== 0) {
      throw new Error("User already exists");
    }

    let user = await UserRepository.addUser(req.body);
    res.status(status.created).json(user);
  } catch (error: any) {
    res.status(status.error).json({
      status: status.error,
      message: error.message,
    });
  }
};

export const addUsersBulk = async (req: Request, res: Response) => {

  try {
    if (!req.file) {
      throw new Error('No file uploaded. Bulk operation requires data as csv file.');
    }

    let csvData: any[] = [];
    let failedRows: any[] = [];
    fs.createReadStream(constants.DEST_FOLDER + req.file.filename)
      .pipe(csvParser())
      .on('data', (row) => {
        csvData.push(row);
      })
      .on('end', async () => {
        try {
          if (csvData.length > constants.MAX_BULK_ADD_LIMIT) {
            throw new Error("Number of rows in csv file are more than allowed limit.")
          }

          let users = [];
          let batchRows = [];
          for (const row of csvData) {
            batchRows.push(row);
            const data = {
              name: row['Name'],
              email: row['Email ID'],
              phone: row['Phone'],
              birth_date: row['Date of Birth (optional)']
            }
            let user = getUserDocumentFromRequestBody(data);
            users.push(user);
            if (users.length === constants.ADD_DB_BATCH_SIZE) {
              try {
                await UserRepository.bulkAddUsers(users);
              } catch (error:any) {
                failedRows.push(...batchRows.map(row => ({ ...row, success: false, error: error.message })));
              }
              batchRows = [];
              users = [];
            }
          }

          if (users.length !== 0) {
            try {
              await UserRepository.bulkAddUsers(users);
            } catch (error:any) {
              failedRows.push(...batchRows.map(row => ({ ...row, success: false, error: error.message })));
            }
          }

          // Prepare the response
          let responseCsv: Buffer = Buffer.from('')
          const filePath = constants.DEST_FOLDER + Date.now().toString() + '_' + 'failed_user_records.csv'
          if (failedRows.length > 0) {
            // Generate CSV string for failed rows
            const csvWriter = createObjectCsvWriter({
              path: filePath,
              header: Object.keys(failedRows[0]).map(key => ({ id: key, title: key }))
            });
            await csvWriter.writeRecords(failedRows);
            responseCsv = fs.readFileSync(filePath);
          }

          // Send the response with CSV content
          res.setHeader('Content-Disposition', 'attachment; filename="failed_rows.csv"');
          res.setHeader('Content-Type', 'text/csv');
          res.send(responseCsv);
        } catch (error) {
          console.error('Error saving User bulk data:', error);
          res.status(500).json({ error: 'Error saving users data.' });
        }
      });

  } catch (error:any) {
    console.error('Error processing CSV:', error);
    res.status(500).json({ error: error.message });
  }
};

export const updateUser = async (req: Request, res: Response) => {
    try {
        const updatedUser = await UserRepository.updateUser(req.body)
        res.status(status.success).json(updatedUser);
    } catch (error: any) {
        res.status(status.bad).send({ error: error.message });
    }
};

export const deleteUser = async (req: Request, res: Response) => {
    const userId = parseInt(req.params.id)
    if (isNaN(userId)) {
        res.status(status.bad).send({ message: "User id is required" });
        return;
    }
    try {
      const mapped = await TreeRepository.countUserMappedTrees(userId);
      if (mapped > 0) {
        throw new Error("User has mapped trees!");
      }

      const assigned = await TreeRepository.countUserAssignedTrees(userId);
      if (assigned > 0) {
        throw new Error("User has assigned trees!");
      }

      const userGroups = await UserGroupRepository.countUserGroups(userId);
      if (userGroups > 0) {
        throw new Error("User is part of groups!");
      }

      let resp = await UserRepository.deleteUser(parseInt(req.params.id));
      console.log(`Deleted User with id: ${req.params.id}`, resp);
      res.status(status.success).json("User deleted successfully");
    } catch (error : any) {
      res.status(status.error).json({
        status: status.error,
        message: error.message,
      });
    }
};

export const getBirthdayNotifications = async (req: Request, res: Response) => {
  try {
    // Safely handle query parameters
    const userIdsParam = req.query.user_ids;
    let userIds: number[] = [];
    
    if (typeof userIdsParam === 'string') {
      userIds = userIdsParam.split(',').map(id => {
        const num = Number(id);
        return isNaN(num) ? null : num;
      }).filter((id): id is number => id !== null);
    } else if (Array.isArray(userIdsParam)) {
      userIds = userIdsParam.map(id => {
        const num = Number(id);
        return isNaN(num) ? null : num;
      }).filter((id): id is number => id !== null);
    }

    // Get users and filter for upcoming birthdays
    const users = await UserRepository.getUsersWithBirthdays(userIds);
    const today = new Date();
    const nextWeek = new Date(today);
    nextWeek.setDate(today.getDate() + 7);

    const notifications = users
      .filter(user => {
        if (!user.birth_date) return false;
        
        try {
          const birthDate = new Date(user.birth_date);
          birthDate.setFullYear(today.getFullYear());
          return birthDate >= today && birthDate <= nextWeek;
        } catch {
          return false;
        }
      })
      .map(user => ({
        id: `birthday-${user.id}`,
        message: `${user.name}'s birthday on ${new Date(user.birth_date!).toLocaleDateString()}`,
        date: user.birth_date
      }));

    res.status(200).json(notifications);
  } catch (error) {
    console.error('Error in getBirthdayNotifications:', error);
    res.status(500).json({ error: "Failed to fetch birthdays" });
  }
};


export const combineUsers = async (req: Request, res: Response) => {

  const { primary_user, secondary_user, delete_secondary } = req.body;
  try {

    // Update trees
    const mappedTrees = { mapped_to_user: primary_user, updated_at: new Date() };
    await TreeRepository.updateTrees(mappedTrees, { mapped_to_user: secondary_user });

    const sponsoredTrees = { sponsored_by_user: primary_user, updated_at: new Date() };
    await TreeRepository.updateTrees(sponsoredTrees, { sponsored_by_user: secondary_user });

    const assignedTrees = { assigned_to: primary_user, updated_at: new Date() };
    await TreeRepository.updateTrees(assignedTrees, { assigned_to: secondary_user });

    const giftedBy = { gifted_by: primary_user, updated_at: new Date() };
    await TreeRepository.updateTrees(giftedBy, { gifted_by: secondary_user });

    const giftedTo = { gifted_to: primary_user, updated_at: new Date() };
    await TreeRepository.updateTrees(giftedTo, { gifted_to: secondary_user });

    // gift requests
    const giftRequests = { user_id: primary_user, updated_at: new Date() };
    await GiftCardsRepository.updateGiftCardRequests(giftRequests, { user_id: secondary_user });

    const giftCardsGiftedTo = { gifted_to: primary_user, updated_at: new Date() };
    await GiftCardsRepository.updateGiftCards(giftCardsGiftedTo, { gifted_to: secondary_user });

    const giftCardsAssignedTo = { assigned_to: primary_user, updated_at: new Date() };
    await GiftCardsRepository.updateGiftCards(giftCardsAssignedTo, { assigned_to: secondary_user });

    const giftRequesRecipients = { recipient: primary_user, updated_at: new Date() };
    await GiftCardsRepository.updateGiftRequestUsers(giftRequesRecipients, { recipient: secondary_user });

    const giftRequestsAssignee = { assignee: primary_user, updated_at: new Date() };
    await GiftCardsRepository.updateGiftRequestUsers(giftRequestsAssignee, { assignee: secondary_user });

    // group users
    await UserGroupRepository.changeUser(primary_user, secondary_user);

    // user relations
    const secondary = { secondary_user: primary_user, updated_at: new Date() };
    await UserRelationRepository.updateUserRelations(secondary, { secondary_user: secondary_user });

    const primary = { primary_user: primary_user, updated_at: new Date() };
    await UserRelationRepository.updateUserRelations(primary, { primary_user: secondary_user });

    // visit users
    await VisitUsersRepository.changeUser(primary_user, secondary_user);

    // albums
    const album = { user_id: primary_user, updated_at: new Date() };
    await AlbumRepository.updateAlbums(album, { user_id: secondary_user });

    // events
    const event = { assigned_by: primary_user, updated_at: new Date() };
    await EventRepository.updateEvents(event, { assigned_by: secondary_user });

    if (delete_secondary) {
      await UserRepository.deleteUser(secondary_user);
    }

    res.status(status.success).json();
  } catch (error: any) {
    console.log("[ERROR]", "usersController.combineUsers", error);
    res.status(status.error).send({ message: "Something went wrong. Please try again after some time!" });
  }
};
