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
import { getWhereOptions } from "./helper/filters";

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
    let whereClause = {};
    if (filters && filters.length > 0) {
        filters.forEach(filter => {
            whereClause = { ...whereClause, ...getWhereOptions(filter.columnField, filter.operatorValue, filter.value) }
        })
    }
    
    let users = await UserRepository.getUsers(offset, limit, whereClause);
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
            let user = getUserDocumentFromRequestBody(row);
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
    try {
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
