// import { Request, Response } from 'express';
// import { errorMessage, successMessage, status } from '../helpers/status';
// import OnSiteStaffModel from '../models/onsitestaff';
// import * as csvhelper from './helper/uploadtocsv';

// export const addStaff = async (req: Request, res: Response): Promise<void> => {
//   try {
//     if (!req.body.name) {
//       throw new Error('User name is required');
//     }
//     if (!req.body.phone) {
//       throw new Error('Contact is required');
//     }
//   } catch (error: any) {
//     res.status(status.bad).send({ error: error.message });
//     return;
//   }

//   // Check if user type exists
//   const userExists = await OnSiteStaffModel.findOne({ email: req.body.email });

//   // If plot exists, return error
//   if (userExists) {
//     res.status(status.bad).send({ error: 'User ID already exists' });
//     return;
//   }

//   const user_id = req.body.name.split(' ')[0];

//   // Tree type object to be saved
//   const obj = {
//     name: req.body.name,
//     user_id: user_id,
//     email: req.body.email || null,
//     role: req.body.role || '',
//     phone: req.body.phone || null,
//     permissions: req.body.permissions || null,
//     date_added: new Date().toISOString(),
//   };

//   const staff = new OnSiteStaffModel(obj);

//   let userRes;
//   try {
//     userRes = await staff.save();
//   } catch (error: any) {
//     res.status(status.error).json({ error: error.message });
//     return;
//   }

//   // Save the info into the sheet
//   try {
//     csvhelper.updateStaffCsv(obj);
//     res.status(status.created).json({
//       user: userRes,
//       csvupload: 'Success',
//     });
//   } catch (error: any) {
//     console.log(error);
//     res.status(status.error).json({
//       user: userRes,
//       csvupload: 'Failure',
//     });
//   }
// };

// export const getTreeLoggingUsers = async (req: Request, res: Response): Promise<void> => {
//   try {
//     const result = await OnSiteStaffModel.find({ role: { $eq: 'treelogging' } });
//     res.status(status.success).send(result);
//   } catch (error: any) {
//     res.status(status.error).json({
//       status: status.error,
//       message: error.message,
//     });
//   }
// };
