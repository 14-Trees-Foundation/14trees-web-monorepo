import { Request, Response } from 'express';
import { User } from '../models/user'; // Import the Sequelize User model
// import { getOffsetAndLimitFromRequest } from './helpers/pagination'; // Import the pagination helper
// import userHelper from './helpers/userHelper'; // Import the user helper
import fs from 'fs';
import csvParser from 'csv-parser';
// import { createCsvWriter } from 'csv-writer';

// export const addUser = async (req: Request, res: Response): Promise<void> => {
//   try {
//     if (!req.body.name) {
//       throw new Error("User name is required");
//     }
//     const user = userHelper.getUserDocumentFromRequestBody(req.body);
//     const result = await user.save();
//     res.status(status.created).json(result);
//   } catch (error) {
//     res.status(status.bad).send({ error: error.message });
//   }
// };

// export const addUsersBulk = async (req: Request, res: Response): Promise<void> => {
//   try {
//     if (!req.file) {
//       throw new Error('No file uploaded. Bulk operation requires data as csv file.');
//     }
//     // Implementation similar to addTree, but for bulk addition of users
//   } catch (error) {
//     console.error('Error processing CSV:', error);
//     res.status(500).json({ error: error.message });
//   }
// };

// export const getUser = async (req: Request, res: Response): Promise<void> => {
//   try {
//     if (req.query.email && req.query.name) {
//       // Implementation for getting a user by email and name
//     } else {
//       const { offset, limit } = getOffsetAndLimitFromRequest(req);
//       const result = await User.findAndCountAll({ offset, limit });
//       res.status(status.success).json(result.rows);
//     }
//   } catch (error) {
//     res.status(status.bad).send({ error: error.message });
//   }
// };

// export const getUsers = async (req: Request, res: Response): Promise<void> => {
//   const { offset, limit } = getOffsetAndLimitFromRequest(req);
//   try {
//     const result = await User.findAndCountAll({ offset, limit });
//     res.status(status.success).json(result.rows);
//   } catch (error) {
//     res.status(status.error).json({ status: status.error, message: error.message });
//   }
// };

// export const updateUser = async (req: Request, res: Response): Promise<void> => {
//   try {
//     const user = await User.findByPk(req.params.id);
//     if (!user) {
//       res.status(status.notfound).json({ status: status.notfound, message: "User not found with given id" });
//     } else {
//       if (req.body.name) user.name = req.body.name;
//       if (req.body.email) user.email = req.body.email;
//       if (req.body.dob) user.dob = req.body.dob;
//       if (req.body.phone) user.phone = req.body.phone;
//       if (req.body.org) user.org = req.body.org;
//       user.userid = userHelper.getUserId(user.name, user.email);
//       const result = await user.save();
//       res.status(status.success).json(result);
//     }
//   } catch (error) {
//     res.status(status.error).json({ status: status.error, message: error.message });
//   }
// };

// export const deleteUser = async (req: Request, res: Response): Promise<void> => {
//   try {
//     const resp = await User.destroy({ where: { id: req.params.id } });
//     console.log("Deleted User with id:", req.params.id, resp);
//     res.status(status.success).json(resp);
//   } catch (error) {
//     res.status(status.error).json({ status: status.error, message: error.message });
//   }
// };
