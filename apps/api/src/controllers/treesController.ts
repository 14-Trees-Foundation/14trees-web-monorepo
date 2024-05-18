// import { errorMessage, successMessage, status } from "../helpers/status";
// import * as csvParser from 'csv-parser'; // Import all members from csv-parser
// import { ObjectCsvWriter } from 'csv-writer'; // Import specific type from csv-writer
// import * as fs from 'fs';
// import * as dotenv from "dotenv"; // Import all members from dotenv

// // Assuming models and helper functions are defined elsewhere
// import { Tree, TreeModel } from "../models/tree";
// import { MyTree, MyTreeModel } from "../models/mytree";
// import { Plot, PlotModel } from "../models/plot";
// import { OnSiteStaff } from "../models/onsitestaff";
// import { TreeType, TreeTypeModel } from "../models/treetype";
// import { TreeUpdatePhoto, treeUpdatePhotoModel } from "../models/tree_update_photos";

// import { UploadFileToS3 } from "./helper/uploadtos3"; // Assuming UploadFileToS3 is a function
// import { uploadToCsv } from "./helper/uploadtocsv"; // Assuming uploadToCsv is a function
// import { mongoose } from "mongoose";
// import { constants } from  "../constants";
// import { getOffsetAndLimitFromRequest } from "./helper/request";
// import { User, userModel } from "../models/user"; // Assuming User interface defined
// import { Request, Response } from "express";

// /*
//   Model - TreeType
//   CRUD Operations for tree_types collection
// */

// module.exports.getTreeTypes = async (req: Request, res: Response) => {
//   const {offset, limit } = getOffsetAndLimitFromRequest(req);
//   let filters: Record<string,any> = {}
//   if (req.query?.name) {
//       filters["name"] = new RegExp(req.query?.name as string, "i")
//   }
//   if (req.query?.sci_name) {
//       filters["scientific_name"] = new RegExp(req.query?.sci_name as string, "i")
//   }
//   if (req.query?.med_use) {
//       filters["med_use"] = new RegExp(req.query?.med_use as string, "i")
//   }
//   if (req.query?.food) {
//       filters["food"] = new RegExp(req.query?.food as string, "i")
//   }

//   try {
//     let result = await TreeTypeModel.find(filters).skip(offset).limit(limit).exec();
//     res.status(status.success).send(result);
//   } catch (error: any) {
//     res.status(status.error).json({
//       status: status.error,
//       message: error.message,
//     });
//   }
// };

// module.exports.addTreeType = async (req: Request,res: Response) => {
//   try {
//     if (!req.body.name) {
//       throw new Error("Tree name is required");
//     }
//     if (!req.body.tree_id) {
//       throw new Error("Tree ID required");
//     }
//   } catch (error) {
//     res.status(status.bad).send({ error: error.message });
//     return;
//   }

//   // Upload images to S3
//   let imageUrl = "";
//   if (req.files && req.files[0]) {
//     imageUrl = await uploadHelper.UploadFileToS3(req.files[0].filename, "treetype");
//   }

//   // Tree type object to be saved
//   let obj = {
//     name: req.body.name,
//     tree_id: req.body.tree_id,
//     desc: req.body.desc,
//     scientific_name: req.body.scientific_name,
//     image: imageUrl,
//     family: req.body.family,
//     habit: req.body.habit,
//     remarkable_char: req.body.remarkable_char,
//     med_use: req.body.med_use,
//     other_use: req.body.other_use,
//     food: req.body.food,
//     eco_value: req.body.eco_value,
//     parts_used: req.body.parts_used,
//   };
//   const treeType = new TreeTypeModel(obj);

//   let treeTypeRes;
//   try {
//     treeTypeRes = await treeType.save();
//   } catch (error) {
//     res.status(status.error).json({ error });
//   }

//   // Save the info into the sheet
//   try {
//     csvhelper.UpdateTreeTypeCsv(obj);
//     res.status(status.created).json({
//       treetype: treeTypeRes,
//       csvupload: "Success",
//     });
//   } catch (error) {
//     res.status(status.error).json({
//       treetype: treeTypeRes,
//       csvupload: "Failure",
//     });
//   }
// };


// module.exports.updateTreeType = async (req: Request,res: Response) => {
//   try {
//     const treeType = await TreeTypeModel.findById(req.params.id);

//     if (!treeType) {
//       throw new Error("Tree type not found for given id");
//     }

//     if (req.body.name) {
//       treeType.name = req.body.name;
//     }
//     if (req.body.desc) {
//       treeType.desc = req.body.desc;
//     }
//     if (req.body.scientific_name) {
//       treeType.scientific_name = req.body.scientific_name;
//     }
//     // Update other fields similarly

//     // Upload images to S3
//     if (req.files && req.files[0]) {
//       const location = await uploadHelper.UploadFileToS3(req.files[0].filename, "treetype");
//       if (location != "") {
//         treeType.image = location; // Update image URL
//       }
//     }

//     // Save updated tree type
//     const updatedTreeType = await treeType.save();
//     res.status(status.success).send(updatedTreeType);
//   } catch (error) {
//     res.status(status.bad).send({ error: error.message });
//   }
// };


// module.exports.deleteTreeType = async (req: Request,res: Response) => {
//   try {
//     // Find the tree type by ID
//     const treeType = await TreeTypeModel.findById(req.params.id);

//     if (!treeType) {
//       throw new Error("Tree type not found for given id");
//     }

//     // Delete the tree type
//     await treeType.remove();

//     // Update the CSV file
//     try {
//       csvhelper.UpdateTreeTypeCsv(treeType, true); // Pass true to indicate deletion
//       res.status(status.success).json({
//         message: "Tree type deleted successfully",
//       });
//     } catch (error) {
//       res.status(status.error).json({
//         error: "Failed to update CSV file",
//       });
//     }
//   } catch (error: any) {
//     res.status(status.bad).send({ error: error.message });
//   }
// };


// /*
//   Model - Tree
//   CRUD Operations for trees collection
// */

// const validateRequestAndGetTreeDocument = async (reqBody) => {

//   if (!reqBody.sapling_id) {
//     throw new Error("Sapling ID required");
//   }
//   if (!reqBody.tree_id) {
//     throw new Error("Tree Type ID required");
//   }
//   if (!reqBody.plot_id) {
//     throw new Error("Plot ID required");
//   }

//   // Check if tree type exists
//   let treetype = await TreeTypeModel.findOne({ tree_id: reqBody.tree_id });
//   if (!treetype) {
//     treetype = await TreeTypeModel.findOne({ _id: reqBody.tree_id })
//   }
//   // If tree type doesn't exists, return error
//   if (!treetype  || treetype.length === 0) {
//     throw new Error("Tree type ID doesn't exist" );
//   }

//   // Check if plot exists
//   let plot = await PlotModel.findOne({
//     $or: [
//       { plot_id: reqBody.plot_id },
//       { _id: reqBody.plot_id }
//     ]
//   })
//   // If plot type doesn't exists, return error
//   if (!plot) {
//     throw new Error("Plot ID doesn't exist" );
//   }

//   // Check if sapling id exists
//   let tree = await TreeModel.findOne({ sapling_id: reqBody.sapling_id });
//   if (tree !== null) {
//     throw new Error("Sapling_id exists, please check!");
//   }

//   // get user
//   let user = null;
//   if (
//     reqBody.user_id !== "" ||
//     reqBody.user_id !== undefined ||
//     reqBody.user_id !== null
//   ) {
//     user = await OnSiteStaff.findOne({
//       $or: [
//         { user_id: reqBody.user_id },
//         { _id: reqBody.user_id },
//       ]
//     });
//   }

//   let mapped_to = null;
//   if (reqBody.mapped_to) {
//     mapped_to = await userModel.findOne({ user_id: reqBody.mapped_to });
//   }

//   // Upload images to S3
//   let imageUrls = [];
//   if (reqBody.images && reqBody.images.length > 0) {
//     let images = reqBody.images.split(",");
//     for (const image in images) {
//       const location = await uploadHelper.UploadFileToS3(images[image], "trees");
//       if (location !== "") {
//         imageUrls.push(location);
//       }
//     }
//   }

//   let loc = null;
//   // Tree object to be saved in database
//   if (reqBody.lat) {
//     loc = {
//       type: "Point",
//       coordinates: [reqBody.lat, reqBody.lng],
//     };
//   }

//   let treeObj = {
//     sapling_id: reqBody.sapling_id,
//     tree_id: treetype.id,
//     plot_id: plot.id,
//     image: imageUrls,
//     location: loc,
//     user_id: user === null ? null : user,
//     mapped_to: mapped_to === null ? null : mapped_to,
//     date_added: new Date().toISOString(),
//   };
//   const treeDoc = new TreeModel(treeObj);

//   return treeDoc
// }

// module.exports.addTree = async (req: Request,res: Response) => {

//   let treeRes;
//   try {
//     let tree = await validateRequestAndGetTreeDocument(req.body);
//     treeRes = await tree.save();
//     res.status(status.created).send(treeRes)
//   } catch (error) {
//     console.log("Tree add error : ", error);
//     res.status(status.error).send({
//       error: error,
//     });
//   }

//   // Uncomment this to send data to CSV
//   // Save the info into the sheet
//   // try {
//   //     await csvhelper.UpdateTreeCsv(treeObj,
//   //         treetype.tree_id,
//   //         treetype.name,
//   //         loc.coordinates,
//   //         plot.plot_id,
//   //         plot.name,
//   //         user);
//   //     res.status(status.created).send({
//   //         treetype: treeRes,
//   //         csvupload: "Success"
//   //     });
//   // } catch (error) {
//   //     res.status(status.error).send({
//   //         treetype: treeRes,
//   //         csvupload: "Failure"
//   //     });
//   // }
// };

// module.exports.getTree = async (req: Request,res: Response) => {
//   if (!req.query.sapling_id) {
//     res.status(status.bad).send({ error: "Sapling ID required" });
//     return;
//   }

//   try {
//     let result = await TreeModel.findOne({ sapling_id: req.query.sapling_id })
//       .populate({ path: "tree_id", select: "name" })
//       .populate({ path: "plot_id", select: "name" });
//     if (result === null) {
//       res.status(status.notfound).send();
//     } else {
//       res.status(status.success).send(result);
//     }
//   } catch (error: any) {
//     res.status(status.error).json({
//       status: status.error,
//       message: error.message,
//     });
//   }
// };

// module.exports.getTrees = async (req: Request,res: Response) => {
//   const { offset, limit } = getOffsetAndLimitFromRequest(req); 
//   try {
//     let result = await TreeModel.find()
//       .skip(offset)
//       .limit(limit);
    
//     res.status(status.success).send(result);
//   } catch (error: any) {
//     res.status(status.error).json({
//       status: status.error,
//       message: error.message,
//     });
//   }
// };

// module.exports.addTreesBulk = async (req: any,res: any) => {

//   try {
//     if (!req.files.csvFile || !req.files.csvFile[0]) {
//       throw new Error('No file uploaded. Bulk operation requires data as csv file.');
//     }

//     let csvData = [];
//     let failedRows = [];
//     fs.createReadStream(constants.DEST_FOLDER + req.files.csvFile[0].filename)
//       .pipe(csvParser())
//       .on('data', (row) => {
//         csvData.push(row);
//       })
//       .on('end', async () => {
//         try {

//           if (csvData.length > constants.MAX_BULK_ADD_LIMIT) {
//             throw new Error("Number of rows in csv file are more than allowed limit.")
//           }

//           let trees = [];
//           let batchRows = [];
//           for (const row of csvData) {
//             let tree = await validateRequestAndGetTreeDocument(row);
//             batchRows.push(row);
//             trees.push(tree);
//             if (trees.length === constants.ADD_DB_BATCH_SIZE) {
//               try {
//                 await TreeModel.bulkSave(trees);
//               } catch (error) {
//                 failedRows.push(...batchRows.map(row => ({ ...row, success: false, error: error.message })));
//               }
//               trees = [];
//               batchRows = [];
//             }
//           }

//           if (trees.length !== 0) {
//             try {
//               await TreeModel.bulkSave(trees);
//             } catch (error: any) {
//               failedRows.push(...batchRows.map(row => ({ ...row, success: false, error: error.message })));
//             }
//           }

//           // Prepare the response
//           let responseCsv = ''
//           const filePath = constants.DEST_FOLDER + Date.now().toString() + '_' + 'failed_tree_records.csv'
//           if (failedRows.length > 0) {
//             // Generate CSV string for failed rows
//             const csvWriter = createCsvWriter({
//               path: filePath,
//               header: Object.keys(failedRows[0]).map(key => ({ id: key, title: key }))
//             });
//             await csvWriter.writeRecords(failedRows);
//             responseCsv = fs.readFileSync(filePath);
//           }

//           // Send the response with CSV content
//           res.setHeader('Content-Disposition', 'attachment; filename="failed_rows.csv"');
//           res.setHeader('Content-Type', 'text/csv');
//           res.send(responseCsv);
//         } catch (error) {
//           console.error('Error saving tree bulk data:', error);
//           res.status(500).json({ error: 'Error saving trees data.' });
//         }
//       });
//   } catch (error) {
//     console.log("Tree add error : ", error);
//     res.status(status.error).send({
//       error: error,
//     });
//   }

// };

// module.exports.updateTree = async (req: any,res: any) => {
//   try {
//     const treeId = req.params.id;

//     // Check if the tree exists
//     let tree = await TreeModel.findById(treeId);

//     if (!tree) {
//       res.status(status.notfound).send({ error: "Tree not found" });
//       return;
//     }

//     // Update tree fields
//     if (req.body.sapling_id && req.body.sapling_id != tree.sapling_id) {
//       let tree = await TreeModel.findOne({ sapling_id: req.body.sapling_id });
//       if (tree !== null) {
//         res
//           .status(status.duplicate)
//           .send({ error: "Sapling_id exists, please check!" });
//         return;
//       }
//       tree.sapling_id = req.body.sapling_id;
//     }
//     if (req.body.tree_id) {
//       // Check if tree type exists
//       const treetype = await TreeTypeModel.findOne({ _id: req.body.tree_id });
//       if (!treetype) {
//         res.status(status.bad).send({ error: "Tree type ID doesn't exist" });
//         return;
//       }
//       tree.tree_id = treetype._id;
//     }
//     if (req.body.plot_id) {
//       // Check if plot exists
//       const plot = await PlotModel.findOne({ _id: req.body.plot_id });
//       if (!plot) {
//         res.status(status.bad).send({ error: "Plot ID doesn't exist" });
//         return;
//       }
//       tree.plot_id = plot._id;
//     }


//     // Upload images to S3
//     let imageUrls = [];
//     if (req.files && req.files.length > 0) {
//       for (const file of req.files) {
//         const location = await uploadHelper.UploadFileToS3(file.filename, "trees");
//         if (location !== "") {
//           imageUrls.push(location);
//         }
//       }
//       tree.image = imageUrls;
//     }

//     let loc = null;
//     if (req.body.lat) {
//       loc = {
//         type: "Point",
//         coordinates: [req.body.lat, req.body.lng],
//       };
//       tree.location = loc;
//     }

//     // Update user if provided
//     if (req.body.user_id) {
//       const user = await OnSiteStaff.findOne({ user_id: req.body.user_id });
//       if (!user) {
//         res.status(status.bad).send({ error: "User ID doesn't exist" });
//         return;
//       }
//       tree.user_id = user.id;
//     }

//     // Save updated tree
//     const updatedTree = await tree.save();
//     res.status(status.success).send(updatedTree);
//   } catch (error: any) {
//     console.error("Tree update error:", error);
//     res.status(status.error).send({ error: error.message });
//   }
// };


// module.exports.deleteTree = async (req: Request,res: Response) => {
//   try {
//     const resp = await TreeModel.findByIdAndDelete(req.params.id).exec();
//     console.log("Deleted tree with the id: %s", req.params.id, resp)
//     res.status(status.success).send({ message: "Tree deleted successfully" });
//   } catch (error: any) {
//     console.error("Tree delete error:", error);
//     res.status(status.error).send({ error: error.message });
//   }
// };

// module.exports.countByPlot = async (req: Request,res: Response) => {
//   const { offset, limit } = getOffsetAndLimitFromRequest(req);
//   if (!req.query.id) {
//     res.status(status.bad).send({ error: "Plot ID required" });
//     return;
//   }

//   try {
//     // Assigned trees in a plot
//     let trees = await TreeModel.aggregate([
//       {
//         $match: {
//           plot_id: mongoose.Types.ObjectId(req.query.id),
//         },
//       },
//       {
//         $lookup: {
//           from: "user_tree_regs",
//           localField: "_id",
//           foreignField: "tree",
//           as: "assigned_to",
//         },
//       },
//       {
//         $unwind: {
//           path: "$assigned_to",
//           preserveNullAndEmptyArrays: true,
//         },
//       },
//       { $skip: offset },
//       { $limit: limit },
//     ]);

//     if (trees === null) {
//       res.status(status.notfound).send();
//     } else {
//       res.status(status.success).json({
//         trees: trees,
//       });
//     }
//   } catch (error: any) {
//     res.status(status.error).json({
//       status: status.error,
//       message: error.message,
//     });
//   }
// };

// module.exports.treeListByPlot = async (req: Request,res: Response) => {
//   const { offset, limit } = getOffsetAndLimitFromRequest(req);
//   try {
//     if (!req.query.plot_name) {
//       res.status(status.bad).send({ error: "Plot name required" });
//       return;
//     }

//     // Find plot name
//     let plot = await PlotModel.findOne({ name: req.query.plot_name });
//     let result = await TreeModel.aggregate([
//       {
//         $match: { plot_id: plot._id },
//       },
//       {
//         $lookup: {
//           from: "tree_types",
//           localField: "tree_id",
//           foreignField: "_id",
//           as: "tree_name",
//         },
//       },
//       {
//         $unwind: "$tree_name",
//       },
//       {
//         $lookup: {
//           from: "onsitestaffs",
//           localField: "user_id",
//           foreignField: "_id",
//           as: "added_by",
//         },
//       },
//       {
//         $unwind: {
//           path: "$added_by",
//           preserveNullAndEmptyArrays: true,
//         },
//       },
//       {
//         $lookup: {
//           from: "user_tree_regs",
//           localField: "_id",
//           foreignField: "tree",
//           as: "user_tree_reg",
//         },
//       },
//       {
//         $unwind: {
//           path: "$user_tree_reg",
//           preserveNullAndEmptyArrays: true,
//         },
//       },
//       {
//         $lookup: {
//           from: "users",
//           localField: "user_tree_reg.user",
//           foreignField: "_id",
//           as: "user",
//         },
//       },
//       {
//         $unwind: {
//           path: "$user",
//           preserveNullAndEmptyArrays: true,
//         },
//       },
//       {
//         $lookup: {
//           from: "users",
//           localField: "user_tree_reg.donated_by",
//           foreignField: "_id",
//           as: "donated_by",
//         },
//       },
//       {
//         $unwind: {
//           path: "$donated_by",
//           preserveNullAndEmptyArrays: true,
//         },
//       },
//       {
//         $project: {
//           sapling_id: 1,
//           date_added: 1,
//           tree_name: "$tree_name.name",
//           added_by: "$added_by.name",
//           assigned_to: "$user.name",
//           donated_by: "$donated_by.name",
//           gifted_by: "$user_tree_reg.gifted_by",
//           planted_by: "$user_tree_reg.planted_by",
//         },
//       },
//       { $skip: offset },
//       { $limit: limit },
//     ]);
//     res.status(status.success).send(result);
//   } catch (error: any) {
//     res.status(status.error).json({
//       status: status.error,
//       message: error.message,
//     });
//   }
// };

// module.exports.getTreeFromId = async (req: Request,res: Response) => {
//   try {
//     let result = await TreeModel.findOne({
//       _id: mongoose.Types.ObjectId(req.query.id),
//     });
//     res.status(status.success).send(result);
//   } catch (error: any) {
//     res.status(status.error).json({
//       status: status.error,
//       message: error.message,
//     });
//   }
// };

// module.exports.treeCountByPlot = async (req: Request,res: Response) => {
//   const { offset, limit } = getOffsetAndLimitFromRequest(req);
//   try {
//     let result = await TreeModel.aggregate([
//       {
//         $group: {
//           _id: "$plot_id",
//           count: { $sum: 1 },
//         },
//       },
//       {
//         $lookup: {
//           from: "plots",
//           localField: "_id",
//           foreignField: "_id",
//           as: "plot_name",
//         },
//       },
//       {
//         $unwind: "$plot_name",
//       },
//       {
//         $project: { "plot_name.name": 1, count: 1 },
//       },
//       {
//         $sort: { count: -1 },
//       },
//       { $skip: offset },
//       { $limit: limit },
//     ]);
//     res.status(status.success).send(result);
//   } catch (error:any) {
//     res.status(status.error).json({
//       status: status.error,
//       message: error.message,
//     });
//   }
// };

// module.exports.treeLoggedByDate = async (req: Request,res: Response) => {
//   const { offset, limit } = getOffsetAndLimitFromRequest(req);
//   try {
//     let result = await TreeModel.aggregate([
//       {
//         $project: {
//           date_added: {
//             $dateToString: { format: "%Y-%m-%d", date: "$date_added" },
//           },
//         },
//       },
//       {
//         $group: {
//           _id: "$date_added",
//           count: { $sum: 1 },
//         },
//       },
//       {
//         $sort: { _id: -1 },
//       },
//       { $skip: offset },
//       { $limit: limit },
//     ]);
//     res.status(status.success).send(result);
//   } catch (error: any) {
//     res.status(status.error).json({
//       status: status.error,
//       message: error.message,
//     });
//   }
// };

// module.exports.treeLogByUser = async (req: Request,res: Response) => {
//   const { offset, limit } = getOffsetAndLimitFromRequest(req);
//   try {
//     let result = await TreeModel.aggregate([
//       {
//         $match: {
//           user_id: {
//             $exists: true,
//             $ne: null,
//           },
//         },
//       },
//       {
//         $group: {
//           _id: {
//             date: "$date_added",
//             user: "$user_id",
//           },
//           count: { $sum: 1 },
//         },
//       },
//       {
//         $lookup: {
//           from: "onsitestaffs",
//           localField: "_id.user",
//           foreignField: "_id",
//           as: "user",
//         },
//       },
//       {
//         $project: {
//           "user.name": 1,
//           count: 1,
//           "_id.date": 1,
//         },
//       },
//       {
//         $sort: { "_id.date": -1 },
//       },
//       { $skip: offset },
//       { $limit: limit },
//     ]);
//     res.status(status.success).send(result);
//   } catch (error: any) {
//     res.status(status.error).json({
//       status: status.error,
//       message: error.message,
//     });
//   }
// };

// module.exports.treeLogByPlot = async (req: Request,res: Response) => {
//   const { offset, limit } = getOffsetAndLimitFromRequest(req);
//   try {
//     let result = await TreeModel.aggregate([
//       {
//         $project: {
//           date_added: {
//             $dateToString: { format: "%Y-%m-%d", date: "$date_added" },
//           },
//           plot_id: 1,
//         },
//       },
//       {
//         $group: {
//           _id: {
//             date: "$date_added",
//             plot: "$plot_id",
//           },
//           count: { $sum: 1 },
//         },
//       },
//       {
//         $lookup: {
//           from: "plots",
//           localField: "_id.plot",
//           foreignField: "_id",
//           as: "plot",
//         },
//       },
//       {
//         $project: {
//           "plot.name": 1,
//           count: 1,
//           "_id.date": 1,
//         },
//       },
//       {
//         $unwind: "$plot",
//       },
//       {
//         $sort: { "_id.date": -1 },
//       },
//       { $skip: offset },
//       { $limit: limit },
//     ]);
//     res.status(status.success).send(result);
//   } catch (error: any) {
//     res.status(status.error).json({
//       status: status.error,
//       message: error.message,
//     });
//   }
// };

// module.exports.treeCountTreeType = async (req: Request,res: Response) => {
//   const { offset, limit } = getOffsetAndLimitFromRequest(req);
//   try {
//     let result = await TreeModel.aggregate([
//       {
//         $group: {
//           _id: {
//             tree_id: "$tree_id",
//           },
//           count: { $sum: 1 },
//         },
//       },
//       {
//         $lookup: {
//           from: "tree_types",
//           localField: "_id.tree_id",
//           foreignField: "_id",
//           as: "tree_type",
//         },
//       },
//       {
//         $project: {
//           "tree_type.name": 1,
//           "tree_type.image": 1,
//           count: 1,
//           _id: 0,
//         },
//       },
//       {
//         $sort: { count: -1 },
//       },
//       { $skip: offset },
//       { $limit: limit },
//     ]);
//     res.status(status.success).send(result);
//   } catch (error: any) {
//     res.status(status.error).json({
//       status: status.error,
//       message: error.message,
//     });
//   }
// };

// module.exports.treeTypeCountByPlot = async (req: Request,res: Response) => {
//   const { offset, limit } = getOffsetAndLimitFromRequest(req);
//   try {
//     let result = await TreeModel.aggregate([
//       {
//         $group: {
//           _id: {
//             tree_id: "$tree_id",
//             plot: "$plot_id",
//           },
//           count: { $sum: 1 },
//         },
//       },
//       {
//         $lookup: {
//           from: "tree_types",
//           localField: "_id.tree_id",
//           foreignField: "_id",
//           as: "tree_type",
//         },
//       },
//       {
//         $lookup: {
//           from: "plots",
//           localField: "_id.plot",
//           foreignField: "_id",
//           as: "plot",
//         },
//       },
//       {
//         $project: {
//           count: 1,
//           "tree_type.name": 1,
//           "plot.name": 1,
//           _id: 0,
//         },
//       },
//       {
//         $unwind: "$tree_type",
//       },
//       {
//         $unwind: "$plot",
//       },
//       {
//         $sort: { count: -1 },
//       },
//       { $skip: offset },
//       { $limit: limit },
//     ]);
//     res.status(status.success).send(result);
//   } catch (error: any) {
//     res.status(status.error).json({
//       status: status.error,
//       message: error.message,
//     });
//   }
// };

// module.exports.addPhotoUpdate = async (req: Request,res: Response) => {
//   try {
//     if (!req.files) {
//       throw new Error("An Image is required");
//     }
//     if (!req.body.sapling_id) {
//       throw new Error("Sapling ID required");
//     }
//   } catch (error: any) {
//     res.status(status.bad).send({ error: error.message });
//     return;
//   }

//   // Upload images to S3
//   let imageUrl = "";
//   if (req.files[0]) {
//     imageUrl = await uploadHelper.UploadFileToS3(req.files[0].filename, "tree_update");
//   }

//   try {
//     let tree = await TreeModel.findOne({ sapling_id: req.body.sapling_id });
//     if (tree === null) {
//       res.status(status.bad).send({ error: "Sapling_id not found!" });
//       return;
//     } else {
//       let date = new Date().toISOString().slice(0, 10);
//       if (req.body.date_added) {
//         date = req.body.date_added;
//       }
//       let tree_update = await treeUpdatePhotoModel.findOne({
//         tree_id: tree._id,
//       });

//       if (tree_update === null) {
//         let treeUpdate = new treeUpdatePhotoModel({
//           tree_id: tree._id,
//           photo_update: [
//             {
//               image: imageUrl,
//               date_added: date,
//             },
//           ],
//         });

//         let resp = await treeUpdate.save();
//         res.status(status.created).send({
//           update: resp,
//         });
//       } else {
//         let resp = await treeUpdatePhotoModel.updateOne(
//           { tree_id: tree._id },
//           {
//             $push: {
//               photo_update: {
//                 image: imageUrl,
//                 date_added: date,
//               },
//             },
//           }
//         );
//         res.status(status.created).send({
//           update: resp,
//         });
//       }
//     }
//   } catch (error) {
//     res.status(status.error).send({
//       error: error,
//     });
//   }
// };
