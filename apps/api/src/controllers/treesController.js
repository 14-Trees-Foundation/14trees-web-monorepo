const { errorMessage, successMessage, status } = require("../helpers/status");
require("dotenv").config();

const TreeModel = require("../models/tree");
const MyTreeModel = require("../models/mytree");
const PlotModel = require("../models/plot");
const OnSiteStaff = require("../models/onsitestaff");
const TreeTypeModel = require("../models/treetype");
const treeUpdatePhotoModel = require("../models/tree_update_photos");

const uploadHelper = require("./helper/uploadtos3");
const csvhelper = require("./helper/uploadtocsv");
var mongoose = require("mongoose");

module.exports.addTreeType = async (req, res) => {
  try {
    if (!req.body.name) {
      throw new Error("Tree name is required");
    }
    if (!req.body.tree_id) {
      throw new Error("Tree ID required");
    }
  } catch (error) {
    res.status(status.bad).send({ error: error.message });
    return;
  }

  // Upload images to S3
  let imageurls = "";
  if (req.files && req.files[0]) {
    await uploadHelper.UploadFileToS3(req.files[0].filename, "treetype");
    // Save the urls with S3 location prefixed for each image
    const s3url =
      "https://14treesplants.s3.ap-south-1.amazonaws.com/treetypes/";
    imageurls = s3url + req.files[0].filename;
  }

  // Tree type object to be saved
  let obj = {
    name: req.body.name,
    tree_id: req.body.tree_id,
    desc: req.body.desc,
    scientific_name: req.body.scientific_name,
    image: imageurls,
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
  } catch (error) {
    res.status(status.error).json({ error });
  }

  // Save the info into the sheet
  try {
    csvhelper.UpdateTreeTypeCsv(obj);
    res.status(status.created).json({
      treetype: treeTypeRes,
      csvupload: "Success",
    });
  } catch (error) {
    res.status(status.error).json({
      treetype: treeTypeRes,
      csvupload: "Failure",
    });
  }
};

module.exports.addTree = async (req, res) => {
  try {
    if (!req.body.sapling_id) {
      throw new Error("Sapling ID required");
    }
    if (!req.body.tree_id) {
      throw new Error("Tree Type ID required");
    }
    if (!req.body.plot_id) {
      throw new Error("Plot ID required");
    }
  } catch (error) {
    res.status(status.bad).send({ error: error.message });
    return;
  }

  // Check if tree type exists
  let treetype = await TreeTypeModel.findOne({ tree_id: req.body.tree_id });

  // If tree type doesn't exists, return error
  if (treetype.length === 0) {
    res.status(status.bad).send({ error: "Tree type ID doesn't exist" });
    return;
  }

  // Check if plot exists
  let plot = await PlotModel.findOne({ plot_id: req.body.plot_id });

  // If plot type doesn't exists, return error
  if (!plot) {
    res.status(status.bad).send({ error: "Plot ID doesn't exist" });
    return;
  }

  // Check if sapling id exists
  try {
    let tree = await TreeModel.findOne({ sapling_id: req.body.sapling_id });
    if (tree !== null) {
      res
        .status(status.duplicate)
        .send({ error: "Sapling_id exists, please check!" });
      return;
    }
  } catch (error) {
    res.status(status.error).send({
      error: error,
    });
    return;
  }

  // get user
  let user = null;
  if (
    req.body.user_id !== "" ||
    req.body.user_id !== undefined ||
    req.body.user_id !== null
  ) {
    user = await OnSiteStaff.findOne({ user_id: req.body.user_id });
  }

  // Upload images to S3
  let imageurls = "";
  if (req.body.images && req.body.images.length > 0) {
    let images = req.body.images.split(",");
    for (const image in images) {
      await uploadHelper.UploadFileToS3(images[image], "trees");
    }
    // Save the urls with S3 location prefixed for each image
    const s3url = "https://14treesplants.s3.ap-south-1.amazonaws.com/trees/";
    imageurls = images.map((x) => s3url + x);
  }

  let loc = null;
  // Tree object to be saved in database
  if (req.body.lat) {
    loc = {
      type: "Point",
      coordinates: [req.body.lat, req.body.lng],
    };
  }

  let treeObj = {
    sapling_id: req.body.sapling_id,
    tree_id: treetype.id,
    plot_id: plot.id,
    image: imageurls,
    location: loc,
    user_id: user === null ? null : user,
    date_added: new Date().toISOString(),
  };
  const tree = new TreeModel(treeObj);

  let treeRes;
  try {
    treeRes = await tree.save();
    res.status(status.created).send({
      treetype: treeRes,
    });
  } catch (error) {
    console.log("Tree add error : ", error);
    res.status(status.error).send({
      error: error,
    });
  }

  // Uncomment this to send data to CSV
  // Save the info into the sheet
  // try {
  //     await csvhelper.UpdateTreeCsv(treeObj,
  //         treetype.tree_id,
  //         treetype.name,
  //         loc.coordinates,
  //         plot.plot_id,
  //         plot.name,
  //         user);
  //     res.status(status.created).send({
  //         treetype: treeRes,
  //         csvupload: "Success"
  //     });
  // } catch (error) {
  //     res.status(status.error).send({
  //         treetype: treeRes,
  //         csvupload: "Failure"
  //     });
  // }
};

module.exports.getTree = async (req, res) => {
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
  } catch (error) {
    res.status(status.error).json({
      status: status.error,
      message: error.message,
    });
  }
};

module.exports.countByPlot = async (req, res) => {
  if (!req.query.id) {
    res.status(status.bad).send({ error: "Plot ID required" });
    return;
  }

  try {
    // Assigned trees in a plot
    let trees = await TreeModel.aggregate([
      {
        $match: {
          plot_id: mongoose.Types.ObjectId(req.query.id),
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
    ]);

    if (trees === null) {
      res.status(status.notfound).send();
    } else {
      res.status(status.success).json({
        trees: trees,
      });
    }
  } catch (error) {
    res.status(status.error).json({
      status: status.error,
      message: error.message,
    });
  }
};

module.exports.treeListByPlot = async (req, res) => {
  try {
    if (!req.query.plot_name) {
      res.status(status.bad).send({ error: "Plot name required" });
      return;
    }

    // Find plot name
    let plot = await PlotModel.findOne({ name: req.query.plot_name });
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
    ]);
    res.status(status.success).send(result);
  } catch (error) {
    res.status(status.error).json({
      status: status.error,
      message: error.message,
    });
  }
};

module.exports.getTreeTypes = async (req, res) => {
  try {
    let result = await TreeTypeModel.find();
    res.status(status.success).send(result);
  } catch (error) {
    res.status(status.error).json({
      status: status.error,
      message: error.message,
    });
  }
};

module.exports.getTreeFromId = async (req, res) => {
  try {
    let result = await TreeModel.findOne({
      _id: mongoose.Types.ObjectId(req.query.id),
    });
    res.status(status.success).send(result);
  } catch (error) {
    res.status(status.error).json({
      status: status.error,
      message: error.message,
    });
  }
};

module.exports.treeCountByPlot = async (req, res) => {
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
    ]);
    res.status(status.success).send(result);
  } catch (error) {
    res.status(status.error).json({
      status: status.error,
      message: error.message,
    });
  }
};

module.exports.treeLoggedByDate = async (req, res) => {
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
    ]);
    res.status(status.success).send(result);
  } catch (error) {
    res.status(status.error).json({
      status: status.error,
      message: error.message,
    });
  }
};

module.exports.treeLogByUser = async (req, res) => {
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
    ]);
    res.status(status.success).send(result);
  } catch (error) {
    res.status(status.error).json({
      status: status.error,
      message: error.message,
    });
  }
};

module.exports.treeLogByPlot = async (req, res) => {
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
    ]);
    res.status(status.success).send(result);
  } catch (error) {
    res.status(status.error).json({
      status: status.error,
      message: error.message,
    });
  }
};

module.exports.treeCountTreeType = async (req, res) => {
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
    ]);
    res.status(status.success).send(result);
  } catch (error) {
    res.status(status.error).json({
      status: status.error,
      message: error.message,
    });
  }
};

module.exports.treeTypeCountByPlot = async (req, res) => {
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
    ]);
    res.status(status.success).send(result);
  } catch (error) {
    res.status(status.error).json({
      status: status.error,
      message: error.message,
    });
  }
};

module.exports.addPhotoUpdate = async (req, res) => {
  try {
    if (!req.files) {
      throw new Error("An Image is required");
    }
    if (!req.body.sapling_id) {
      throw new Error("Sapling ID required");
    }
  } catch (error) {
    res.status(status.bad).send({ error: error.message });
    return;
  }

  // Upload images to S3
  let imageurls = "";
  if (req.files[0]) {
    await uploadHelper.UploadFileToS3(req.files[0].filename, "tree_update");
    // Save the urls with S3 location prefixed for each image
    const s3url =
      "https://14treesplants.s3.ap-south-1.amazonaws.com/tree_update/";
    imageurls = s3url + req.files[0].filename;
  }

  try {
    let tree = await TreeModel.findOne({ sapling_id: req.body.sapling_id });
    if (tree === null) {
      res.status(status.bad).send({ error: "Sapling_id not found!" });
      return;
    } else {
      let date = new Date().toISOString().slice(0, 10);
      let tree_update = await treeUpdatePhotoModel.findOne({
        tree_id: tree._id,
      });

      if (tree_update === null) {
        let treeUpdate = new treeUpdatePhotoModel({
          tree_id: tree._id,
          photo_update: [
            {
              image: imageurls,
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
                image: imageurls,
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
  } catch (error) {
    res.status(status.error).send({
      error: error,
    });
  }
};
