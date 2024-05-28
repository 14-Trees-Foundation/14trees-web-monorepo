import { Request, Response } from "express";
import { errorMessage, successMessage, status } from "../helpers/status";
import csvParser from 'csv-parser';
import { createObjectCsvWriter } from 'csv-writer';
import fs from 'fs';
import dotenv from "dotenv";
import TreeModel from "../models/tree";
import MyTreeModel from "../models/mytree";
import PlotModel from "../models/plot";
import OnSiteStaff from "../models/onsitestaff";
import TreeTypeModel from "../models/treetype";
import treeUpdatePhotoModel from "../models/tree_update_photos";
import * as uploadHelper from "./helper/uploadtos3";
import * as csvhelper from "./helper/uploadtocsv";
import mongoose from "mongoose";
import { constants } from  "../constants";
import { getOffsetAndLimitFromRequest } from "./helper/request";
import userModel from "../models/user";
import { isTypedArray } from "util/types";
import { isArray } from "lodash";
import { getQueryExpression } from "./helper/filters";
import TreesCopyModel from "../models/trees_copy";

dotenv.config();

/*
  Model - TreeType
  CRUD Operations for tree_types collection
*/

export const getTreeTypes = async (req: Request, res: Response) => {
  const {offset, limit } = getOffsetAndLimitFromRequest(req);
  let filters: any = {}
  if (req.query?.name) {
      filters["name"] = new RegExp(req.query.name.toString(), "i")
  }
  if (req.query?.sci_name) {
      filters["scientific_name"] = new RegExp(req.query.sci_name.toString(), "i")
  }
  if (req.query?.med_use) {
      filters["med_use"] = new RegExp(req.query.med_use.toString(), "i")
  }
  if (req.query?.food) {
      filters["food"] = new RegExp(req.query.food.toString(), "i")
  }

  try {
    let result = await TreeTypeModel.find(filters).skip(offset).limit(limit).exec();
    let resultCount = await TreeTypeModel.find(filters).estimatedDocumentCount();
    res.status(status.success).send({
      total: resultCount,
      result: result
    });
  } catch (error: any) {
    res.status(status.error).json({
      status: status.error,
      message: error.message,
    });
  }
};

export const addTreeType = async (req: Request, res: Response) => {
  try {
    if (!req.body.name) {
      throw new Error("Tree name is required");
    }
    if (!req.body.tree_id) {
      throw new Error("Tree ID required");
    }
  } catch (error: any) {
    res.status(status.bad).send({ error: error.message });
    return;
  }

  // Upload images to S3
  let imageUrl = "";
  if (req.files && isArray(req.files) && req.files[0]) {
    imageUrl = await uploadHelper.UploadFileToS3(req.files[0].filename, "treetype");
  }

  // Tree type object to be saved
  let obj = {
    name: req.body.name,
    tree_id: req.body.tree_id,
    desc: req.body.desc,
    scientific_name: req.body.scientific_name,
    image: imageUrl,
    family: req.body.family,
    habit: req.body.habit,
    remarkable_char: req.body.remarkable_char,
    med_use: req.body.med_use,
    other_use: req.body.other_use,
    food: req.body.food,
    eco_value: req.body.eco_value,
    parts_used: req.body.parts_used,
  };
  const treeType = new TreeTypeModel(obj);

  let treeTypeRes;
  try {
    treeTypeRes = await treeType.save();
  } catch (error: any) {
    res.status(status.error).json({ error });
  }

  // Save the info into the sheet
  try {
    csvhelper.UpdateTreeTypeCsv(obj);
    res.status(status.created).json({
      treetype: treeTypeRes,
      csvupload: "Success",
    });
  } catch (error: any) {
    res.status(status.error).json({
      treetype: treeTypeRes,
      csvupload: "Failure",
    });
  }
};


export const updateTreeType = async (req: Request, res: Response) => {
  try {
    const treeType = await TreeTypeModel.findById(req.params.id);

    if (!treeType) {
      throw new Error("Tree type not found for given id");
    }

    if (req.body.name) {
      treeType.name = req.body.name;
    }
    if (req.body.desc) {
      treeType.desc = req.body.desc;
    }
    if (req.body.scientific_name) {
      treeType.scientific_name = req.body.scientific_name;
    }
    // Update other fields similarly

    // Upload images to S3
    if (req.files && isArray(req.files) && req.files[0]) {
      const location = await uploadHelper.UploadFileToS3(req.files[0].filename, "treetype");
      if (location != "") {
        treeType.image = location; // Update image URL
      }
    }

    // Save updated tree type
    const updatedTreeType = await treeType.save();
    res.status(status.success).send(updatedTreeType);
  } catch (error: any) {
    res.status(status.bad).send({ error: error.message });
  }
};

export const deleteTreeType = async (req: Request, res: Response) => {
    try {
      // Find the tree type by ID
      const treeType = await TreeTypeModel.findById(req.params.id);
  
      if (!treeType) {
        throw new Error("Tree type not found for given id");
      }
  
      // Delete the tree type
      await treeType.remove();
  
      // Update the CSV file
      try {
        csvhelper.UpdateTreeTypeCsv(treeType); // Pass true to indicate deletion
        res.status(status.success).json({
          message: "Tree type deleted successfully",
        });
      } catch (error: any) {
        res.status(status.error).json({
          error: "Failed to update CSV file",
        });
      }
    } catch (error: any) {
      res.status(status.bad).send({ error: error.message });
    }
  };
  
  export const searchTreeTypes = async (req: Request, res: Response) => {
    try {
      if (!req.params.search || req.params.search.length < 3) {
        res.status(status.bad).send({ error: "Please provide at least 3 char to search"});
        return;
      }
  
      const { offset, limit } = getOffsetAndLimitFromRequest(req);
      const regex = new RegExp(req.params.search, 'i');
      const treeTypes = await TreeTypeModel.find({name: { $regex: regex }}).skip(offset).limit(limit);
      res.status(status.success).send(treeTypes);
      return;
    } catch (error: any) {
      res.status(status.bad).send({ error: error.message });
      return;
    }
  };
  
  
  /*
    Model - Tree
    CRUD Operations for trees collection
  */
  
  const validateRequestAndGetTreeDocument = async (reqBody: any) => {
  
    if (!reqBody.sapling_id) {
      throw new Error("Sapling ID required");
    }
    if (!reqBody.tree_id) {
      throw new Error("Tree Type ID required");
    }
    if (!reqBody.plot_id) {
      throw new Error("Plot ID required");
    }
  
    // Check if tree type exists
    let treetype = await TreeTypeModel.findOne({ tree_id: reqBody.tree_id });
    if (!treetype) {
      treetype = await TreeTypeModel.findOne({ _id: reqBody.tree_id })
    }
    // If tree type doesn't exists, return error
    if (!treetype) {
      throw new Error("Tree type ID doesn't exist" );
    }
  
    // Check if plot exists
    let plot = await PlotModel.findOne({
      $or: [
        { plot_id: reqBody.plot_id },
        { _id: reqBody.plot_id }
      ]
    })
    // If plot type doesn't exists, return error
    if (!plot) {
      throw new Error("Plot ID doesn't exist" );
    }
  
    // Check if sapling id exists
    let tree = await TreeModel.findOne({ sapling_id: reqBody.sapling_id });
    if (tree !== null) {
      throw new Error("Sapling_id exists, please check!");
    }
  
    // get user
    let user = null;
    if (
      reqBody.user_id !== "" ||
      reqBody.user_id !== undefined ||
      reqBody.user_id !== null
    ) {
      user = await OnSiteStaff.findOne({
        $or: [
          { user_id: reqBody.user_id },
          { _id: reqBody.user_id },
        ]
      });
    }
  
    let mapped_to = null;
    if (reqBody.mapped_to) {
      mapped_to = await userModel.findOne({ user_id: reqBody.mapped_to });
    }
  
    // Upload images to S3
    let imageUrls = [];
    if (reqBody.images && reqBody.images.length > 0) {
      let images = reqBody.images.split(",");
      for (const image in images) {
        const location = await uploadHelper.UploadFileToS3(images[image], "trees");
        if (location !== "") {
          imageUrls.push(location);
        }
      }
    }
  
    let loc = null;
    // Tree object to be saved in database
    if (reqBody.lat) {
      loc = {
        type: "Point",
        coordinates: [reqBody.lat, reqBody.lng],
      };
    }
  
    let treeObj = {
      sapling_id: reqBody.sapling_id,
      tree_id: treetype.id,
      plot_id: plot.id,
      image: imageUrls,
      location: loc,
      user_id: user === null ? null : user,
      mapped_to: mapped_to === null ? null : mapped_to,
      date_added: new Date().toISOString(),
    };
    const treeDoc = new TreeModel(treeObj);
  
    return treeDoc
  }

  export const addTree = async (req: Request, res: Response) => {
    let treeRes;
    try {
      let tree = await validateRequestAndGetTreeDocument(req.body);
      treeRes = await tree.save();
      res.status(status.created).send(treeRes);
    } catch (error: any) {
      console.log("Tree add error : ", error);
      res.status(status.error).send({
        error: error,
      });
    }
  };
  
  export const getTree = async (req: Request, res: Response) => {
    if (!req.query.sapling_id) {
      res.status(status.bad).send({ error: "Sapling ID required" });
      return;
    }
  
    try {
      let result = await TreeModel.findOne({ sapling_id: req.query.sapling_id })
        .populate({ path: "tree_id", select: "name" })
        .populate({ path: "plot_id", select: "name" });
      if (result === null) {
        res.status(status.notfound).send();
      } else {
        res.status(status.success).send(result);
      }
    } catch (error: any) {
      res.status(status.error).json({
        status: status.error,
        message: error.message,
      });
    }
  };
  
  export const getTrees = async (req: Request, res: Response) => {
    const { offset, limit } = getOffsetAndLimitFromRequest(req); 
    const filterReq = req.body.filters;
    let filters = {};
    if (filterReq && filterReq.length != 0) {
      if (filterReq[0].columnField === "plot_id") {
        filters = getQueryExpression("plot.name", filterReq[0].operatorValue, filterReq[0].value)
      } else if (filterReq[0].columnField === "tree_id") {
        filters = getQueryExpression("tree.name", filterReq[0].operatorValue, filterReq[0].value)
      }
    }
    try {

      let data = await TreesCopyModel.find(filters).skip(offset).limit(limit);
      let count = await TreesCopyModel.find(filters).count();
      res.status(status.success).send({
        total: count,
        results: data
      });
    } catch (error: any) {
      res.status(status.error).json({
        status: status.error,
        message: error.message,
      });
    }
  };
  
  export const addTreesBulk = async (req: Request, res: Response) => {
    try {
      if (!req.files || !isArray(req.files) && (!req.files.csvFile || !req.files.csvFile[0])) {
        throw new Error('No file uploaded. Bulk operation requires data as csv file.');
      }
  
      let csvData: any[] = [];
      let failedRows: any[] = [];
      fs.createReadStream(constants.DEST_FOLDER + (req.files as any).csvFile[0].filename)
        .pipe(csvParser())
        .on('data', (row) => {
          csvData.push(row);
        })
        .on('end', async () => {
          try {
            if (csvData.length > constants.MAX_BULK_ADD_LIMIT) {
              throw new Error("Number of rows in csv file are more than allowed limit.")
            }
  
            let trees = [];
            let batchRows = [];
            for (const row of csvData) {
              let tree = await validateRequestAndGetTreeDocument(row);
              batchRows.push(row);
              trees.push(tree);
              if (trees.length === constants.ADD_DB_BATCH_SIZE) {
                try {
                  await TreeModel.bulkSave(trees);
                } catch (error: any) {
                  failedRows.push(...batchRows.map(row => ({ ...row, success: false, error: error.message })));
                }
                trees = [];
                batchRows = [];
              }
            }
  
            if (trees.length !== 0) {
              try {
                await TreeModel.bulkSave(trees);
              } catch (error: any) {
                failedRows.push(...batchRows.map(row => ({ ...row, success: false, error: error.message })));
              }
            }
  
            let responseCsv: Buffer = Buffer.from('');
            const filePath = constants.DEST_FOLDER + Date.now().toString() + '_' + 'failed_tree_records.csv';
            if (failedRows.length > 0) {
              const csvWriter = createObjectCsvWriter({
                path: filePath,
                header: Object.keys(failedRows[0]).map(key => ({ id: key, title: key }))
              });
              await csvWriter.writeRecords(failedRows);
              responseCsv = fs.readFileSync(filePath);
            }
  
            res.setHeader('Content-Disposition', 'attachment; filename="failed_rows.csv"');
            res.setHeader('Content-Type', 'text/csv');
            res.send(responseCsv);
          } catch (error: any) {
            console.error('Error saving tree bulk data:', error);
            res.status(500).json({ error: 'Error saving trees data.' });
          }
        });
    } catch (error: any) {
      console.log("Tree add error : ", error);
      res.status(status.error).send({
        error: error,
      });
    }
  };

  export const updateTree = async (req: Request, res: Response) => {
    try {
      const treeId = req.params.id;
  
      // Check if the tree exists
      let tree = await TreeModel.findById(treeId);
  
      if (!tree) {
        res.status(status.notfound).send({ error: "Tree not found" });
        return;
      }
  
      // Update tree fields
      if (req.body.sapling_id && req.body.sapling_id != tree.sapling_id) {
        let existingTree = await TreeModel.findOne({ sapling_id: req.body.sapling_id });
        if (existingTree !== null) {
          res.status(status.duplicate).send({ error: "Sapling_id exists, please check!" });
          return;
        }
        tree.sapling_id = req.body.sapling_id;
      }
      if (req.body.tree_id) {
        // Check if tree type exists
        const treetype = await TreeTypeModel.findOne({ _id: req.body.tree_id });
        if (!treetype) {
          res.status(status.bad).send({ error: "Tree type ID doesn't exist" });
          return;
        }
        tree.tree_id = treetype._id;
      }
      if (req.body.plot_id) {
        // Check if plot exists
        const plot = await PlotModel.findOne({ _id: req.body.plot_id });
        if (!plot) {
          res.status(status.bad).send({ error: "Plot ID doesn't exist" });
          return;
        }
        tree.plot_id = plot._id;
      }
  
      // Upload images to S3
      let imageUrls: string[] = [];
      if (req.files && isArray(req.files)) {
        for (const file of req.files) {
          const location = await uploadHelper.UploadFileToS3(file.filename, "trees");
          if (location !== "") {
            imageUrls.push(location);
          }
        }
        tree.image = imageUrls;
      }
  
      if (req.body.lat) {
        tree.location = {
          type: "Point",
          // coordinates: [parseFloat(req.body.lat), parseFloat(req.body.lng)], // TODO: for some reason coordinates property is not getting reflected
        }
      }
  
      // Update user if provided
      if (req.body.user_id) {
        const user = await OnSiteStaff.findOne({ user_id: req.body.user_id });
        if (!user) {
          res.status(status.bad).send({ error: "User ID doesn't exist" });
          return;
        }
        tree.user_id = user.id;
      }

      if (req.body.link || req.body.link === "" ) tree.link = req.body.link;
  
      // Save updated tree
      const updatedTree = await tree.save();
      res.status(status.success).send(updatedTree);
    } catch (error: any) {
      console.error("Tree update error:", error);
      res.status(status.error).send({ error: error.message });
    }
  };
  
  export const deleteTree = async (req: Request, res: Response) => {
    try {
      const resp = await TreeModel.findByIdAndDelete(req.params.id).exec();
      console.log("Deleted tree with the id:", req.params.id, resp);
      res.status(status.success).send({ message: "Tree deleted successfully" });
    } catch (error: any) {
      console.error("Tree delete error:", error);
      res.status(status.error).send({ error: error.message });
    }
  };
  
  export const countByPlot = async (req: Request, res: Response) => {
    const { offset, limit } = getOffsetAndLimitFromRequest(req);
    if (!req.query.id) {
      res.status(status.bad).send({ error: "Plot ID required" });
      return;
    }
  
    try {
      // Assigned trees in a plot
      let trees = await TreeModel.aggregate([
        {
          $match: {
            plot_id: new mongoose.Types.ObjectId(req.query.id.toString()),
          },
        },
        {
          $lookup: {
            from: "user_tree_regs",
            localField: "_id",
            foreignField: "tree",
            as: "assigned_to",
          },
        },
        {
          $unwind: {
            path: "$assigned_to",
            preserveNullAndEmptyArrays: true,
          },
        },
        { $skip: offset },
        { $limit: limit },
      ]);
  
      if (trees === null) {
        res.status(status.notfound).send();
      } else {
        res.status(status.success).json({
          trees: trees,
        });
      }
    } catch (error: any) {
      res.status(status.error).json({
        status: status.error,
        message: error.message,
      });
    }
  };

  export const treeListByPlot = async (req: Request, res: Response) => {
    const { offset, limit } = getOffsetAndLimitFromRequest(req);
    try {
      if (!req.query.plot_name) {
        res.status(status.bad).send({ error: "Plot name required" });
        return;
      }
  
      // Find plot name
      let plot = await PlotModel.findOne({ name: req.query.plot_name });
  
      if (!plot) {
        res.status(status.notfound).send({ error: "Plot not found" });
        return;
      }
  
      let result = await TreeModel.aggregate([
        {
          $match: { plot_id: plot._id },
        },
        {
          $lookup: {
            from: "tree_types",
            localField: "tree_id",
            foreignField: "_id",
            as: "tree_name",
          },
        },
        {
          $unwind: "$tree_name",
        },
        {
          $lookup: {
            from: "onsitestaffs",
            localField: "user_id",
            foreignField: "_id",
            as: "added_by",
          },
        },
        {
          $unwind: {
            path: "$added_by",
            preserveNullAndEmptyArrays: true,
          },
        },
        {
          $lookup: {
            from: "user_tree_regs",
            localField: "_id",
            foreignField: "tree",
            as: "user_tree_reg",
          },
        },
        {
          $unwind: {
            path: "$user_tree_reg",
            preserveNullAndEmptyArrays: true,
          },
        },
        {
          $lookup: {
            from: "users",
            localField: "user_tree_reg.user",
            foreignField: "_id",
            as: "user",
          },
        },
        {
          $unwind: {
            path: "$user",
            preserveNullAndEmptyArrays: true,
          },
        },
        {
          $lookup: {
            from: "users",
            localField: "user_tree_reg.donated_by",
            foreignField: "_id",
            as: "donated_by",
          },
        },
        {
          $unwind: {
            path: "$donated_by",
            preserveNullAndEmptyArrays: true,
          },
        },
        {
          $project: {
            sapling_id: 1,
            date_added: 1,
            tree_name: "$tree_name.name",
            added_by: "$added_by.name",
            assigned_to: "$user.name",
            donated_by: "$donated_by.name",
            gifted_by: "$user_tree_reg.gifted_by",
            planted_by: "$user_tree_reg.planted_by",
          },
        },
        { $skip: offset },
        { $limit: limit },
      ]);
  
      res.status(status.success).send(result);
    } catch (error: any) {
      res.status(status.error).json({
        status: status.error,
        message: error.message,
      });
    }
  };

  export const getTreeFromId = async (req: Request, res: Response) => {
    try {
      if (!req.query.id) {
        throw new Error("tree id is required")
      }
      let result = await TreeModel.findOne({
        _id: new mongoose.Types.ObjectId(req.query.id.toString()),
      });
      res.status(status.success).send(result);
    } catch (error: any) {
      res.status(status.error).json({
        status: status.error,
        message: error.message,
      });
    }
  };
  
  export const treeCountByPlot = async (req: Request, res: Response) => {
    const { offset, limit } = getOffsetAndLimitFromRequest(req);
    try {
      let result = await TreeModel.aggregate([
        {
          $group: {
            _id: "$plot_id",
            count: { $sum: 1 },
          },
        },
        {
          $lookup: {
            from: "plots",
            localField: "_id",
            foreignField: "_id",
            as: "plot_name",
          },
        },
        {
          $unwind: "$plot_name",
        },
        {
          $project: { "plot_name.name": 1, count: 1 },
        },
        {
          $sort: { count: -1 },
        },
        { $skip: offset },
        { $limit: limit },
      ]);
      res.status(status.success).send(result);
    } catch (error: any) {
      res.status(status.error).json({
        status: status.error,
        message: error.message,
      });
    }
  };
  
  export const treeLoggedByDate = async (req: Request, res: Response) => {
    const { offset, limit } = getOffsetAndLimitFromRequest(req);
    try {
      let result = await TreeModel.aggregate([
        {
          $project: {
            date_added: {
              $dateToString: { format: "%Y-%m-%d", date: "$date_added" },
            },
          },
        },
        {
          $group: {
            _id: "$date_added",
            count: { $sum: 1 },
          },
        },
        {
          $sort: { _id: -1 },
        },
        { $skip: offset },
        { $limit: limit },
      ]);
      res.status(status.success).send(result);
    } catch (error: any) {
      res.status(status.error).json({
        status: status.error,
        message: error.message,
      });
    }
  };
  
  export const treeLogByUser = async (req: Request, res: Response) => {
    const { offset, limit } = getOffsetAndLimitFromRequest(req);
    try {
      let result = await TreeModel.aggregate([
        {
          $match: {
            user_id: {
              $exists: true,
              $ne: null,
            },
          },
        },
        {
          $group: {
            _id: {
              date: "$date_added",
              user: "$user_id",
            },
            count: { $sum: 1 },
          },
        },
        {
          $lookup: {
            from: "onsitestaffs",
            localField: "_id.user",
            foreignField: "_id",
            as: "user",
          },
        },
        {
          $project: {
            "user.name": 1,
            count: 1,
            "_id.date": 1,
          },
        },
        {
          $sort: { "_id.date": -1 },
        },
        { $skip: offset },
        { $limit: limit },
      ]);
      res.status(status.success).send(result);
    } catch (error: any) {
      res.status(status.error).json({
        status: status.error,
        message: error.message,
      });
    }
  };

  export const treeLogByPlot = async (req: Request, res: Response) => {
    const { offset, limit } = getOffsetAndLimitFromRequest(req);
    try {
      let result = await TreeModel.aggregate([
        {
          $project: {
            date_added: {
              $dateToString: { format: "%Y-%m-%d", date: "$date_added" },
            },
            plot_id: 1,
          },
        },
        {
          $group: {
            _id: {
              date: "$date_added",
              plot: "$plot_id",
            },
            count: { $sum: 1 },
          },
        },
        {
          $lookup: {
            from: "plots",
            localField: "_id.plot",
            foreignField: "_id",
            as: "plot",
          },
        },
        {
          $project: {
            "plot.name": 1,
            count: 1,
            "_id.date": 1,
          },
        },
        {
          $unwind: "$plot",
        },
        {
          $sort: { "_id.date": -1 },
        },
        { $skip: offset },
        { $limit: limit },
      ]);
      res.status(status.success).send(result);
    } catch (error: any) {
      res.status(status.error).json({
        status: status.error,
        message: error.message,
      });
    }
  };
  
  export const treeCountTreeType = async (req: Request, res: Response) => {
    const { offset, limit } = getOffsetAndLimitFromRequest(req);
    try {
      let result = await TreeModel.aggregate([
        {
          $group: {
            _id: {
              tree_id: "$tree_id",
            },
            count: { $sum: 1 },
          },
        },
        {
          $lookup: {
            from: "tree_types",
            localField: "_id.tree_id",
            foreignField: "_id",
            as: "tree_type",
          },
        },
        {
          $project: {
            "tree_type.name": 1,
            "tree_type.image": 1,
            count: 1,
            _id: 0,
          },
        },
        {
          $sort: { count: -1 },
        },
        { $skip: offset },
        { $limit: limit },
      ]);
      res.status(status.success).send(result);
    } catch (error: any) {
      res.status(status.error).json({
        status: status.error,
        message: error.message,
      });
    }
  };

  export const treeTypeCountByPlot = async (req: Request, res: Response) => {
    const { offset, limit } = getOffsetAndLimitFromRequest(req);
    try {
      let result = await TreeModel.aggregate([
        {
          $group: {
            _id: {
              tree_id: "$tree_id",
              plot: "$plot_id",
            },
            count: { $sum: 1 },
          },
        },
        {
          $lookup: {
            from: "tree_types",
            localField: "_id.tree_id",
            foreignField: "_id",
            as: "tree_type",
          },
        },
        {
          $lookup: {
            from: "plots",
            localField: "_id.plot",
            foreignField: "_id",
            as: "plot",
          },
        },
        {
          $project: {
            count: 1,
            "tree_type.name": 1,
            "plot.name": 1,
            _id: 0,
          },
        },
        {
          $unwind: "$tree_type",
        },
        {
          $unwind: "$plot",
        },
        {
          $sort: { count: -1 },
        },
        { $skip: offset },
        { $limit: limit },
      ]);
      res.status(status.success).send(result);
    } catch (error: any) {
      res.status(status.error).json({
        status: status.error,
        message: error.message,
      });
    }
  };
  
  export const addPhotoUpdate = async (req: Request, res: Response) => {
    try {
      if (!req.files) {
        throw new Error("An Image is required");
      }
      if (!req.body.sapling_id) {
        throw new Error("Sapling ID required");
      }
    } catch (error: any) {
      res.status(status.bad).send({ error: error.message });
      return;
    }
  
    // Upload images to S3
    let imageUrl = "";
    if (req.files && isArray(req.files) && req.files.length !== 0) {
      imageUrl = await uploadHelper.UploadFileToS3(req.files[0].filename, "tree_update");
    }
  
    try {
      let tree = await TreeModel.findOne({ sapling_id: req.body.sapling_id });
      if (tree === null) {
        res.status(status.bad).send({ error: "Sapling_id not found!" });
        return;
      } else {
        let date = new Date().toISOString().slice(0, 10);
        if (req.body.date_added) {
          date = req.body.date_added;
        }
        let tree_update = await treeUpdatePhotoModel.findOne({
          tree_id: tree._id,
        });
  
        if (tree_update === null) {
          let treeUpdate = new treeUpdatePhotoModel({
            tree_id: tree._id,
            photo_update: [
              {
                image: imageUrl,
                date_added: date,
              },
            ],
          });
  
          let resp = await treeUpdate.save();
          res.status(status.created).send({
            update: resp,
          });
        } else {
          let resp = await treeUpdatePhotoModel.updateOne(
            { tree_id: tree._id },
            {
              $push: {
                photo_update: {
                  image: imageUrl,
                  date_added: date,
                },
              },
            }
          );
          res.status(status.created).send({
            update: resp,
          });
        }
      }
    } catch (error: any) {
      res.status(status.error).send({
        error: error,
      });
    }
  };