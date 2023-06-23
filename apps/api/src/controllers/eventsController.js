var mongoose = require("mongoose");

const { status } = require("../helpers/status");
const UserModel = require("../models/user");
const EventModel = require("../models/events");
const TreeModel = require("../models/tree");
const PlotModel = require("../models/plot");
const UserTreeModel = require("../models/userprofile");
const uploadHelper = require("./helper/uploadtos3");
const userHelper = require("./helper/users");
const csvhelper = require("./helper/uploadtocsv");
const orgModel = require("../models/org");
const corpEventModel = require("../models/corp_events");
const userTreeModel = require("../models/userprofile");

module.exports.getOverallOrgDashboard = async (req, res) => {
  try {
    if (!req.query.fromdate) {
      throw new Error("Invalid from date!");
    }
    if (!req.query.todate) {
      throw new Error("Invalid to date!");
    }
    if (!req.query.org) {
      throw new Error("Invalid org!");
    }
  } catch (error) {
    res.status(status.bad).send({ error: error.message });
    return;
  }

  try {
    let org = await orgModel.findOne(
      { _id: mongoose.Types.ObjectId(`${req.query.org}`) },
      { name: 1, _id: 0 }
    );
    let result = await UserTreeModel.aggregate([
      {
        $match: {
          orgid: mongoose.Types.ObjectId(`${req.query.org}`),
          date_added: {
            $gte: new Date(req.query.fromdate),
            $lte: new Date(req.query.todate),
          },
        },
      },
      {
        $lookup: {
          from: "users",
          localField: "user",
          foreignField: "_id",
          as: "user",
        },
      },
      { $unwind: "$user" },
      {
        $lookup: {
          from: "trees",
          localField: "tree",
          foreignField: "_id",
          as: "tree",
        },
      },
      { $unwind: "$tree" },
      {
        $project: {
          sapling_id: "$tree.sapling_id",
          name: "$user.name",
          profile_image: 1,
          tree_image: "$tree.image",
          _id: 0,
        },
      },
    ]);
    res.status(status.success).send({
      result: result,
      org: org.name,
    });
  } catch (error) {
    res.status(status.error).send();
  }
};

module.exports.getOverallPlotDashboard = async (req, res) => {
  try {
    if (!req.query.fromdate) {
      throw new Error("Invalid from date!");
    }
    if (!req.query.todate) {
      throw new Error("Invalid to date!");
    }
    if (!req.query.plot) {
      throw new Error("Invalid plot!");
    }
  } catch (error) {
    res.status(status.bad).send({ error: error.message });
    return;
  }

  try {
    let plot = await PlotModel.findOne({
      _id: mongoose.Types.ObjectId(`${req.query.plot}`),
    });

    let pipeline = [];
    pipeline.push(
      {
        $lookup: {
          from: "trees",
          localField: "tree",
          foreignField: "_id",
          as: "trees",
        },
      },
      { $unwind: "$trees" }
    );
    if (req.query.link) {
      pipeline.push({
        $match: {
          "trees.plot_id": mongoose.Types.ObjectId(`${plot._id}`),
          "trees.link": req.query.link,
          date_added: {
            $gte: new Date(req.query.fromdate),
            $lte: new Date(req.query.todate),
          },
        },
      });
    } else {
      pipeline.push({
        $match: {
          "trees.plot_id": mongoose.Types.ObjectId(`${plot._id}`),
          date_added: {
            $gte: new Date(req.query.fromdate),
            $lte: new Date(req.query.todate),
          },
        },
      });
    }

    pipeline.push(
      {
        $lookup: {
          from: "users",
          localField: "user",
          foreignField: "_id",
          as: "user",
        },
      },
      { $unwind: "$user" },
      {
        $project: {
          sapling_id: "$trees.sapling_id",
          name: "$user.name",
          profile_image: 1,
          tree_image: "$trees.image",
          desc: "$trees.desc",
          _id: 0,
        },
      }
    );
    let result = await UserTreeModel.aggregate(pipeline);

    res.status(status.success).send({
      result: result,
      plotname: plot.name,
    });
  } catch (error) {
    res.status(status.error).send();
  }
};

module.exports.getBirthdayEvent = async (req, res) => {
  const id = req.query.id;
  try {
    let result = await EventModel.findOne({ link: id })
      .populate({ path: "assigned_by", select: "name" })
      .populate({ path: "assigned_to", select: "name" })
      .populate({
        path: "user_trees",
        populate: {
          path: "tree",
          populate: {
            path: "tree_id plot_id",
          },
        },
        select: "profile_image memories",
      });
    if (result === null) {
      res.status(status.notfound).send();
    }
    res.status(status.success).send({
      data: result,
    });
  } catch (error) {
    res.status(status.notfound).send();
  }
};

module.exports.addEvents = async (req, res) => {
  const fields = req.body;
  let saplingids = fields.sapling_id.split(/[ ,]+/);
  let mimageurl;
  let userimages;
  let donor;
  try {
    if (fields.type === "1" || fields.type === "2" || fields.type === "3") {
      let user_tree_reg_ids = [];

      // Add user to the database if not exists
      let user = await userHelper.addUser(req, res);

      // Memory image urls
      if (
        req.body.albumimages !== undefined &&
        req.body.albumimages.length > 0
      ) {
        mimageurl = req.body.albumimages.split(",");
      }

      // User Profile images
      if (req.body.userimages !== undefined && req.body.userimages.length > 0) {
        userimages = req.body.userimages.split(",");
        for (const image in userimages) {
          await uploadHelper.UploadFileToS3(userimages[image], "users");
        }
      }

      const s3urlprofile =
        "https://14treesplants.s3.ap-south-1.amazonaws.com/users/";
      let uimageurl =
        userimages !== undefined ? userimages.map((x) => s3urlprofile + x) : "";

      if (req.body.donor) {
        let dUser = await UserModel.findOne({ _id: req.body.donor });
        donor = dUser.name;
      }

      for (let i = 0; i < saplingids.length; i++) {
        let tree = await TreeModel.findOne({ sapling_id: saplingids[i] });
        let user_tree_data = new UserTreeModel({
          tree: tree.id,
          user: user.id,
          profile_image: uimageurl,
          memories: mimageurl,
          orgid: req.body.org
            ? mongoose.Types.ObjectId(req.body.org)
            : mongoose.Types.ObjectId("61726fe62793a0a9994b8bc2"),
          donated_by: req.body.donor
            ? mongoose.Types.ObjectId(req.body.donor)
            : null,
          gifted_by: req.body.gifted_by ? req.body.gifted_by : null,
          planted_by: req.body.planted_by ? req.body.planted_by : null,
          date_added: new Date().toISOString(),
        });

        let user_tree_reg_res = await user_tree_data.save();
        if (req.body.desc) {
          await TreeModel.updateOne(
            { sapling_id: saplingids[i] },
            { $set: { desc: req.body.desc } }
          );
        }
        user_tree_reg_ids.push(user_tree_reg_res._id);
      }
      let link = Math.random().toString(26).slice(2, 10);
      let event_model = new EventModel({
        assigned_to: user._id,
        assigned_by: req.body.donor,
        user_trees: user_tree_reg_ids,
        plot_id: req.body.plot_id,
        type: req.body.type,
        link: link,
        desc: req.body.desc ? req.body.desc : "",
        date: new Date().toISOString(),
      });
      let result = await event_model.save();
      res.status(status.created).send({
        result: result,
      });
    }
  } catch (error) {
    console.log(error);
    res.status(status.error).send();
  }
};

module.exports.addCorpEvent = async (req, res) => {
  const fields = req.body;
  let saplingids = fields.sapling_ids.split(/[ ,]+/);

  if (!fields.event_name || !fields.event_link || !fields.long_desc) {
    res.status(status.bad).send({ error: "Required fields are missing" });
    return;
  }
  try {
    let tree_ids = [];

    let logos;
    // Logo images
    if (req.body.logos !== undefined) {
      if (req.body.logos.length > 0) {
        logos = req.body.logos.split(",");
        for (const image in logos) {
          await uploadHelper.UploadFileToS3(logos[image], "logos");
        }
      }
    }

    let header_img;
    // Header Image
    if (req.body.header_img !== undefined) {
      if (req.body.header_img.length > 0) {
        header_img = req.body.header_img.split(",");
        for (const image in header_img) {
          await uploadHelper.UploadFileToS3(header_img[image], "logos");
        }
      }
    }
    const s3logos = "https://14treesplants.s3.ap-south-1.amazonaws.com/logos/";
    let logourl = logos !== undefined ? logos.map((x) => s3logos + x) : "";
    let headerimgurl = header_img !== undefined ? s3logos + header_img[0] : "";

    let memoryimages;
    // Memories for the visit
    if (req.body.memoryimages !== undefined) {
      if (req.body.memoryimages.length > 0) {
        memoryimages = req.body.memoryimages.split(",");
        for (const image in memoryimages) {
          await uploadHelper.UploadFileToS3(memoryimages[image], "memories");
        }
      }
    }

    const s3urlmemories =
      "https://14treesplants.s3.ap-south-1.amazonaws.com/memories/";
    let mimageurl =
      memoryimages !== undefined
        ? memoryimages.map((x) => s3urlmemories + x)
        : "";

    for (let i = 0; i < saplingids.length; i++) {
      let tree = await TreeModel.findOne({ sapling_id: saplingids[i] });
      tree_ids.push(tree._id);
    }
    let event_model = new corpEventModel({
      event_link: req.body.event_link,
      event_name: req.body.event_name,
      tree_ids: tree_ids,
      plot_id: mongoose.Types.ObjectId(req.body.plot_id),
      title: req.body.title,
      logo: logourl,
      short_desc: req.body.short_desc,
      long_desc: req.body.long_desc,
      album: mimageurl,
      header_img: headerimgurl,
      num_people: req.body.num_people ? req.body.num_people : 1,
      date_added: req.body.date_org ? new Date(req.body.date_org) : new Date().toISOString(),
    });
    let result = await event_model.save();
    res.status(status.created).send({
      result: result,
    });
  } catch (error) {
    console.log(error);
    res.status(status.error).send();
  }
};

module.exports.getCorpEvent = async (req, res) => {
  if (!req.query.event_id) {
    res.status(status.bad).send({ error: "Event ID required" });
    return;
  }

  try {
    let corpEvent = await corpEventModel.aggregate([
      {
        $match: {
          event_link: req.query.event_id,
        },
      },
      {
        $lookup: {
          from: "trees",
          localField: "tree_ids",
          foreignField: "_id",
          pipeline: [
            {
              $project: {
                sapling_id: 1,
                tree_id: 1,
                image: 1,
                date_added: 1,
                _id: 1,
              },
            },
          ],
          as: "trees",
        },
      },
      {
        $unwind: { path: "$trees" },
      },
      {
        $lookup: {
          from: "tree_types",
          localField: "trees.tree_id",
          foreignField: "_id",
          as: "trees.tree_types",
        },
      },
      {
        $unwind: { path: "$trees.tree_types" },
      },
      {
        $lookup: {
          from: "tree_update_photos",
          localField: "trees._id",
          foreignField: "tree_id",
          as: "trees.updates",
        },
      },
      {
        $unwind: { path: "$trees.updates", preserveNullAndEmptyArrays: true },
      },
      {
        $group: {
          _id: "$_id",
          event_name: { $first: "$event_name" },
          event_link: { $first: "$event_link" },
          plot_id: { $first: "$plot_id" },
          title: { $first: "$title" },
          logo: { $first: "$logo" },
          short_desc: { $first: "$short_desc" },
          long_desc: { $first: "$long_desc" },
          album: { $first: "$album" },
          date_added: { $first: "$date_added" },
          num_people: { $first: "$num_people" },
          header_img: { $first: "$header_img" },
          plot_desc: { $first: "$plot_desc" },
          plot_img: { $first: "$plot_img" },
          trees: { $push: "$trees" },
        },
      },
      {
        $lookup: {
          from: "plots",
          localField: "plot_id",
          foreignField: "_id",
          pipeline: [
            {
              $project: {
                name: 1,
                _id: 0,
              },
            },
          ],
          as: "plot",
        },
      },
      {
        $unwind: { path: "$plot" },
      },
    ]);

  
    res.status(status.success).json({
      event: corpEvent,
    });
  } catch (error) {
    res.status(status.bad).send({ error: error.message });
    return;
  }
};
