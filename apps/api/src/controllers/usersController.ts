import { Request, Response } from "express";
import { constants } from "../constants";
import { errorMessage, successMessage, status } from "../helpers/status";
import UserModel from "../models/user";
import UserTreeModel from "../models/userprofile";
import * as userHelper from "./helper/users";
import { getOffsetAndLimitFromRequest } from "./helper/request";
import csvParser from 'csv-parser';
import { createObjectCsvWriter } from 'csv-writer';
import fs from 'fs';

/*
    Model - User
    CRUD Operations for users collection
*/

export const addUser = async (req: Request, res: Response) => {
  try {
    if (!req.body.name) {
      throw new Error("User name is required");
    }
  } catch (error: any) {
    res.status(status.bad).send({ error: error.message });
    return;
  }

  try {
    let user = userHelper.getUserDocumentFromRequestBody(req.body);
    let result = await user.save();
    res.status(status.created).json(result);
  } catch (error: any) {
    res.status(status.duplicate).json({
      status: status.duplicate,
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
            let user = userHelper.getUserDocumentFromRequestBody(row);
            users.push(user);
            if (users.length === constants.ADD_DB_BATCH_SIZE) {
              try {
                await UserModel.bulkSave(users);
              } catch (error:any) {
                failedRows.push(...batchRows.map(row => ({ ...row, success: false, error: error.message })));
              }
              batchRows = [];
              users = [];
            }
          }

          if (users.length !== 0) {
            try {
              await UserModel.bulkSave(users);
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

export const getUser = async (req: Request, res: Response) => {
  try {
    if (req.query.email && req.query.name) {
      let userid = userHelper.getUserId((req.query.name as string), (req.query.email as string))

      let result = await UserModel.findOne({ userid: userid });
      if (result === null) {
        res.status(status.notfound).send();
      } else {
        let lastProfile = await UserTreeModel.find(
          { user: result._id },
          { _id: 0 },
        )
          .populate({
            path: "tree",
            select: "sapling_id date_added -_id",
            populate: { path: "tree_id", select: "name -_id" },
          })
          .select("tree");
        res.status(status.success).json({
          user: result,
          tree: lastProfile,
        });
      }
    } else {
      const { offset, limit } = getOffsetAndLimitFromRequest(req);
      let result = await UserModel.find().skip(offset).limit(limit);
      let resultCount = await UserModel.find().estimatedDocumentCount();
      res.status(status.success).send({
        result: result,
        total: resultCount
      });
    }

  } catch (error: any) {
    res.status(status.bad).send({ error: error.message });
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
    const regex = new RegExp(req.params.search, 'i');
    const users = await UserModel.find({
      $or: [
        {email: { $regex: regex }},
        {name: { $regex: regex }},
      ]
    }).skip(offset).limit(limit);
    res.status(status.success).send(users);
    return;
  } catch (error:any) {
    res.status(status.bad).send({ error: error.message });
    return;
  }
};

export const getUsers = async (req: Request, res: Response) => {
  const { offset, limit } = getOffsetAndLimitFromRequest(req);
  try {
    let result = await UserModel.find().skip(offset).limit(limit);
    let resultCount = await UserModel.find().estimatedDocumentCount();
    res.status(status.success).send({
      result: result,
      total: resultCount
    });
  } catch (error:any) {
    res.status(status.error).json({
      status: status.error,
      message: error.message,
    });
  }
};

export const updateUser = async (req: Request, res: Response) => {

  try {
    let user = await UserModel.findById(req.params.id);
    if (!user) {
      res.status(status.notfound).json({
        status: status.notfound,
        message: "User not found with given id"
      })
      return;
    }

    if (req.body.name) user.name = req.body.name;
    if (req.body.email) user.email = req.body.email;
    if (req.body.dob) user.dob = req.body.dob;
    if (req.body.phone) user.phone = req.body.phone;

    user.userid = userHelper.getUserId(user.name, user.email? user.email: '');

    let result = await user.save();
    res.status(status.success).json(result);
  } catch (error: any) {
    res.status(status.error).json({
      status: status.error,
      message: error.message,
    });
  }
};

export const deleteUser = async (req: Request, res: Response) => {
    try {
      let resp = await UserModel.findByIdAndDelete(req.params.id).exec();
      console.log(`Deleted User with id: ${req.params.id}`, resp);
      res.status(status.success).json(resp);
    } catch (error : any) {
      res.status(status.error).json({
        status: status.error,
        message: error.message,
      });
    }
  };
