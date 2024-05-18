import { Request, Response } from "express";
import mongoose, { Types } from "mongoose";
import status from "../helpers/status";
import UserModel from "../models/user";
import EventModel from "../models/events";
import TreeModel from "../models/tree";
import PlotModel from "../models/plot";
import UserTreeModel from "../models/userprofile";
import uploadHelper from "./helper/uploadtos3";
import userHelper from "./helper/users";
import csvhelper from "./helper/uploadtocsv";
import orgModel from "../models/org";
import corpEventModel from "../models/corp_events";
import { getOffsetAndLimitFromRequest } from "./helper/request";

export const getOverallOrgDashboard = async (req: Request, res: Response) => {
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
    const org = await orgModel.findOne(
      { _id: new Types.ObjectId(`${req.query.org}`) },
      { name: 1, _id: 0 }
    );
    const result = await UserTreeModel.aggregate([
      {
        $match: {
          orgid: new Types.ObjectId(`${req.query.org}`),
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

export const getOverallPlotDashboard = async (req: Request, res: Response) => {
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
    const plot = await PlotModel.findOne({
      _id: new Types.ObjectId(`${req.query.plot}`),
    });

    const pipeline: any[] = [];
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
          "trees.plot_id": new Types.ObjectId(`${plot._id}`),
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
          "trees.plot_id": new Types.ObjectId(`${plot._id}`),
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
          _id: 0,
        },
      }
    );
    const result = await UserTreeModel.aggregate(pipeline);
    res.status(status.success).send({
      result: result,
      plot: plot.name,
    });
  } catch (error) {
    res.status(status.error).send();
  }
};

export const getOrgUserList = async (req: Request, res: Response) => {
  try {
    if (!req.query.org) {
      throw new Error("Invalid org!");
    }
  } catch (error) {
    res.status(status.bad).send({ error: error.message });
    return;
  }

  try {
    const result = await UserModel.aggregate([
      {
        $match: {
          orgid: new Types.ObjectId(`${req.query.org}`),
        },
      },
      {
        $lookup: {
          from: "userprofiles",
          localField: "_id",
          foreignField: "user",
          as: "profile",
        },
      },
      { $unwind: "$profile" },
      {
        $project: {
          name: "$name",
          profile_image: "$profile.profile_image",
          role: "$role",
          _id: 0,
        },
      },
    ]);
    res.status(status.success).send({ result: result });
  } catch (error) {
    res.status(status.error).send();
  }
};

export const getPlotUserList = async (req: Request, res: Response) => {
  try {
    if (!req.query.plot) {
      throw new Error("Invalid plot!");
    }
  } catch (error) {
    res.status(status.bad).send({ error: error.message });
    return;
  }

  try {
    const plot = await PlotModel.findOne({
      _id: new Types.ObjectId(`${req.query.plot}`),
    });

    const pipeline: any[] = [];
    pipeline.push(
      {
        $lookup: {
          from: "trees",
          localField: "tree",
          foreignField: "_id",
          as: "trees",
        },
      },
      { $unwind: "$trees" },
      {
        $match: {
          "trees.plot_id": new Types.ObjectId(`${plot._id}`),
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
        $project: {
          sapling_id: "$trees.sapling_id",
          name: "$user.name",
          profile_image: 1,
          tree_image: "$trees.image",
          _id: 0,
        },
      }
    );
    const result = await UserTreeModel.aggregate(pipeline);
    res.status(status.success).send({ result: result });
  } catch (error) {
    res.status(status.error).send();
  }
};

export const getPlotList = async (req: Request, res: Response) => {
  try {
    if (!req.query.org) {
      throw new Error("Invalid org!");
    }
  } catch (error) {
    res.status(status.bad).send({ error: error.message });
    return;
  }

  try {
    const plots = await PlotModel.find({
      orgid: new Types.ObjectId(`${req.query.org}`),
    });
    res.status(status.success).send({ result: plots });
  } catch (error) {
    res.status(status.error).send();
  }
};

export const getOrgTreeList = async (req: Request, res: Response) => {
  try {
    if (!req.query.org) {
      throw new Error("Invalid org!");
    }
  } catch (error) {
    res.status(status.bad).send({ error: error.message });
    return;
  }

  try {
    const pipeline: any[] = [];
    pipeline.push(
      {
        $match: {
          orgid: new Types.ObjectId(`${req.query.org}`),
        },
      },
      {
        $lookup: {
          from: "trees",
          localField: "trees",
          foreignField: "_id",
          as: "trees",
        },
      },
      { $unwind: "$trees" },
      {
        $lookup: {
          from: "userprofiles",
          localField: "trees.user",
          foreignField: "user",
          as: "user",
        },
      },
      { $unwind: "$user" },
      {
        $project: {
          name: "$user.name",
          sapling_id: "$trees.sapling_id",
          species: "$trees.species",
          tree_image: "$trees.image",
          date_planted: "$trees.date_planted",
          location: "$trees.location",
          coordinates: "$trees.coordinates",
          _id: 0,
        },
      }
    );
    const result = await PlotModel.aggregate(pipeline);
    res.status(status.success).send({ result: result });
  } catch (error) {
    res.status(status.error).send();
  }
};

export const getUserList = async (req: Request, res: Response) => {
  try {
    if (!req.query.org) {
      throw new Error("Invalid org!");
    }
  } catch (error) {
    res.status(status.bad).send({ error: error.message });
    return;
  }

  try {
    const result = await UserModel.find({
      orgid: new Types.ObjectId(`${req.query.org}`),
    });
    res.status(status.success).send({ result: result });
  } catch (error) {
    res.status(status.error).send();
  }
};

export const getOrgUser = async (req: Request, res: Response) => {
  try {
    if (!req.query.user) {
      throw new Error("Invalid user!");
    }
  } catch (error) {
    res.status(status.bad).send({ error: error.message });
    return;
  }

  try {
    const user = await UserModel.findOne({
      _id: new Types.ObjectId(`${req.query.user}`),
    });
    const plotList = await PlotModel.find({
      orgid: new Types.ObjectId(`${user.orgid}`),
    });
    res.status(status.success).send({ user: user, plots: plotList });
  } catch (error) {
    res.status(status.error).send();
  }
};

export const getPlot = async (req: Request, res: Response) => {
  try {
    if (!req.query.plot) {
      throw new Error("Invalid plot!");
    }
  } catch (error) {
    res.status(status.bad).send({ error: error.message });
    return;
  }

  try {
    const plot = await PlotModel.findOne({
_id: new Types.ObjectId(`${req.query.plot}`),
    });
    const treeList = await TreeModel.find({
      plot_id: new Types.ObjectId(`${plot._id}`),
    });
    res.status(status.success).send({ plot: plot, trees: treeList });
  } catch (error) {
    res.status(status.error).send();
  }
};

export const getBirthdayEvent = async (req: Request, res: Response) => {
  const id = req.query.id;
  try {
    const result = await EventModel.findOne({ link: id })
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

/*
Model - Event
CRUD Operations for events collection
*/

export const addEvents = async (req: Request, res: Response) => {
  const fields = req.body;
  let saplingids = fields.sapling_id.split(/[ ,]+/);
  let mimageurl;
  let userimages;
  let donor;

  try {
    if (
      fields.type === "1" ||
      fields.type === "2" ||
      fields.type === "3"
    ) {
      let user_tree_reg_ids = [];

      // Add user to the database if not exists
      const userDoc = await userHelper.getUserDocumentFromRequestBody(req);
      const user = await UserModel.findOne({ userid: userDoc.userid });
      if (!user) {
        user = await userDoc.save();
      }

      // Memory image urls
      if (
        req.body.albumimages !== undefined &&
        req.body.albumimages.length > 0
      ) {
        mimageurl = req.body.albumimages.split(",");
      }

      // User Profile images
      let userImageUrls = []
      if (req.body.userimages !== undefined && req.body.userimages.length > 0) {
        userimages = req.body.userimages.split(",");
        for (const image in userimages) {
          const location = await uploadHelper.UploadFileToS3(userimages[image], "users");
          if (location !== "") {
            userImageUrls.push(location);
          }
        }
      }

      if (req.body.donor) {
        let dUser = await UserModel.findOne({ _id: req.body.donor });
        donor = dUser.name;
      }

      for (let i = 0; i < saplingids.length; i++) {
        let tree = await TreeModel.findOne({ sapling_id: saplingids[i] });
        let user_tree_data = new UserTreeModel({
          tree: tree.id,
          user: user.id,
          profile_image: userImageUrls,
          memories: mimageurl,
          orgid: req.body.org
            ? new Types.ObjectId(req.body.org)
            : new Types.ObjectId("61726fe62793a0a9994b8bc2"),
          donated_by: req.body.donor
            ? new Types.ObjectId(req.body.donor)
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

export const removeEventAndUnassignTree = async (req: Request, res: Response) => {
  const fields = req.body;
  let saplingIds = fields.sapling_id.split(/[ ,]+/);

  try {
    let treeIds = [];
    let failedSaplingIds = [];

    for (let i = 0; i < saplingIds.length; i++) {
      let tree = await TreeModel.findOne({ sapling_id: saplingIds[i] });
      if (tree) {
        treeIds.push(tree._id);
      } else {
        failedSaplingIds.push(saplingIds[i]);
      }
    }

    if (failedSaplingIds.length > 0) {
      res.status(status.bad).send({
        error: `Failed to find trees with sapling IDs: ${failedSaplingIds.join(
          ", "
        )}`,
      });
      return;
    }

    const userTreeRegs = await UserTreeModel.find({ tree: { $in: treeIds } });
    for (const userTreeReg of userTreeRegs) {
      await userTreeReg.deleteOne();
    }

    // delete event model for the same
  } catch (error) {
    console.log(error);
    res.status(status.error).send();
  }
};

export const getEvents = async (req: Request, res: Response) => {
  const { offset, limit } = getOffsetAndLimitFromRequest(req);
  let filters = {}
    if (req.query?.name) {
        filters["name"] = new RegExp(req.query?.name, "i")
    }
    if (req.query?.type) {
        filters["type"] = new RegExp(req.query?.type, "i")
    }
  try {
      const result = await EventModel.find(filters).skip(offset).limit(limit);
      res.status(status.success).send(result);
  } catch (error) {
      res.status(status.error).json({
          status: status.error,
          message: error.message,
      });
  }
}

export const deleteEvent = async (req: Request, res: Response) => {
  try {
      const resp = await EventModel.findByIdAndDelete(req.params.id).exec();
      console.log("Delete event Response for id: %s", req.params.id, resp)

      res.status(status.success).json({
        message: "Event deleted successfully",
      });
  } catch (error) {
      res.status(status.bad).send({ error: error.message });
  }
};

/*
Model - corpEvent
CRUD Operations for corp_events collection
*/

export const addCorpEvent = async (req: Request, res: Response) => {
  const fields = req.body;
  let saplingids = fields.sapling_ids.split(/[ ,]+/);

  if (!fields.event_name || !fields.event_link || !fields.long_desc) {
    res.status(status.bad).send({ error: "Required fields are missing" });
    return;
  }
  try {
    let tree_ids = [];
    let logoUrls = [];
    // Logo images
    if (req.body.logos !== undefined) {
      if (req.body.logos.length > 0) {
        let logos = req.body.logos.split(",");
        for (const image in logos) {
          const location = await uploadHelper.UploadFileToS3(logos[image], "logos");
          if (location !== "") {
            logoUrls.push(location);
          }
        }
      }
    }

    let headerImageUrls = [];
    // Header Image
    if (req.body.header_img !== undefined) {
      if (req.body.header_img.length > 0) {
        let headerImages = req.body.header_img.split(",");
        for (const image in headerImages) {
          const location = await uploadHelper.UploadFileToS3(headerImages[image], "logos");
          if (location !== "") {
            headerImageUrls.push(location);
          }
        }
      }
    }

    let memoryImageUrls = [];
    // Memories for the visit
    if (req.body.memoryimages !== undefined) {
      if (req.body.memoryimages.length > 0) {
        let memoryImages = req.body.memoryimages.split(",");
        for (const image in memoryImages) {
          const location = await uploadHelper.UploadFileToS3(memoryImages[image], "memories");
          if (location != "") {
            memoryImageUrls.push(location);
          }
        }
      }
    }

    for (let i = 0; i < saplingids.length; i++) {
      let tree = await TreeModel.findOne({ sapling_id: saplingids[i] });
      tree_ids.push(tree._id);
    }
    const event_model = new corpEventModel({
      event_link: req.body.event_link,
      event_name: req.body.event_name,
      tree_ids: tree_ids,
      plot_id: new Types.ObjectId(req.body.plot_id),
      title: req.body.title,
      logo: logoUrls,
      short_desc: req.body.short_desc,
      long_desc: req.body.long_desc,
      album: memoryImageUrls,
      header_img: headerImageUrls,
      num_people: req.body.num_people ? req.body.num_people : 1,
      date_added: req.body.date_org ? new Date(req.body.date_org) : new Date().toISOString(),
    });
    const result = await event_model.save();
    res.status(status.created).send({
      result: result,
    });
  } catch (error) {
    console.log(error);
    res.status(status.error).send();
  }
};

export const getCorpEvent = async (req: Request, res: Response) => {
  const { offset, limit } = getOffsetAndLimitFromRequest(req);
  if (!req.query.event_id) {
    res.status(status.bad).send({ error: "Event ID required" });
    return;
  }

  try {
    const corpEvent = await corpEventModel.aggregate([
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
          as