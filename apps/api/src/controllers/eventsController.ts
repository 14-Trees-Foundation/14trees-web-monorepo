import { Request, Response } from "express";
import mongoose from "mongoose";
import { status } from "../helpers/status";
import UserModel from "../models/user";
import EventModel from "../models/events";
import TreeModel from "../models/tree";
import PlotModel from "../models/plot";
import UserTreeModel from "../models/userprofile";
import * as uploadHelper from "./helper/uploadtos3";
import * as userHelper from "./helper/users";
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
  } catch (error: any) {
    res.status(status.bad).send({ error: error.message });
    return;
  }

  try {
    let org = await orgModel.findOne(
      { _id: new mongoose.Types.ObjectId(`${req.query.org}`) },
      { name: 1, _id: 0 }
    );
    let result = await UserTreeModel.aggregate([
      {
        $match: {
          orgid: new mongoose.Types.ObjectId(`${req.query.org}`),
          date_added: {
            $gte: new Date(req.query.fromdate.toString()),
            $lte: new Date(req.query.todate.toString()),
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
      org: org?.name,
    });
  } catch (error: any) {
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
  } catch (error: any) {
    res.status(status.bad).send({ error: error.message });
    return;
  }

  try {
    let plot = await PlotModel.findOne({
      _id: new mongoose.Types.ObjectId(`${req.query.plot}`),
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
          "trees.plot_id": new mongoose.Types.ObjectId(`${plot?._id}`),
          "trees.link": req.query.link,
          date_added: {
            $gte: new Date(req.query.fromdate.toString()),
            $lte: new Date(req.query.todate.toString()),
          },
        },
      });
    } else {
      pipeline.push({
        $match: {
          "trees.plot_id": new mongoose.Types.ObjectId(`${plot?._id}`),
          date_added: {
            $gte: new Date(req.query.fromdate.toString()),
            $lte: new Date(req.query.todate.toString()),
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
      plotname: plot?.name,
    });
  } catch (error: any) {
    res.status(status.error).send();
  }
};

export const getBirthdayEvent = async (req: Request, res: Response) => {
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
  } catch (error: any) {
    res.status(status.notfound).send();
  }
};

/*
    Model - Event
    CRUD Operations for events collection
*/

export const addEvents = async (req: Request, res: Response) => {
    const fields = req.body;
    const saplingids = fields.sapling_id.split(/[ ,]+/);
    let mimageurl: string | undefined;
    let userimages: string[];
    let donor: string | undefined;
  
    try {
      if (fields.type === "1" || fields.type === "2" || fields.type === "3") {
        const user_tree_reg_ids: mongoose.Types.ObjectId[] = [];
  
        // Add user to the database if not exists
        const userDoc = await userHelper.getUserDocumentFromRequestBody(fields);
        let user = await UserModel.findOne({ userid: userDoc.userid });
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
        let userImageUrls: string[] = [];
        if (
          req.body.userimages !== undefined &&
          req.body.userimages.length > 0
        ) {
          userimages = req.body.userimages.split(",");
          for (const image of userimages) {
            const location = await uploadHelper.UploadFileToS3(image, "users");
            if (location !== "") {
              userImageUrls.push(location);
            }
          }
        }
  
        if (req.body.donor) {
          const dUser = await UserModel.findOne({ _id: req.body.donor });
          donor = dUser?.name;
        }
  
        for (const saplingid of saplingids) {
          const tree = await TreeModel.findOne({ sapling_id: saplingid });
          if (!tree) continue;
          const user_tree_data = new UserTreeModel({
            tree: tree._id,
            user: user?._id,
            profile_image: userImageUrls,
            memories: mimageurl,
            orgid: req.body.org
              ? new mongoose.Types.ObjectId(req.body.org)
              : new mongoose.Types.ObjectId("61726fe62793a0a9994b8bc2"),
            donated_by: req.body.donor
              ? new mongoose.Types.ObjectId(req.body.donor)
              : null,
            gifted_by: req.body.gifted_by ? req.body.gifted_by : null,
            planted_by: req.body.planted_by ? req.body.planted_by : null,
            date_added: new Date().toISOString(),
          });
  
          const user_tree_reg_res = await user_tree_data.save();
          if (req.body.desc) {
            await TreeModel.updateOne(
              { sapling_id: saplingid },
              { $set: { desc: req.body.desc } }
            );
          }
          user_tree_reg_ids.push(user_tree_reg_res._id);
        }
        const link = Math.random().toString(26).slice(2, 10);
        const event_model = new EventModel({
          assigned_to: user?._id,
          assigned_by: req.body.donor,
          user_trees: user_tree_reg_ids,
          plot_id: req.body.plot_id,
          type: req.body.type,
          link: link,
          desc: req.body.desc ? req.body.desc : "",
          date: new Date().toISOString(),
        });
        const result = await event_model.save();
        res.status(status.created).send({
          result: result,
        });
      }
    } catch (error: any) {
      console.log(error);
      res.status(status.error).send();
    }
  };
  
  export const removeEventAndUnassignTree = async (
    req: Request,
    res: Response
  ) => {
    const fields = req.body;
    const saplingIds = fields.sapling_id.split(/[ ,]+/);
  
    try {
      const treeIds: mongoose.Types.ObjectId[] = [];
  
      for (const saplingId of saplingIds) {
        const tree = await TreeModel.findOne({ sapling_id: saplingId });
        if (tree) {
          treeIds.push(tree._id);
        }
      }
  
      const userTreeRegs = await UserTreeModel.find({ tree: { $in: treeIds } });
      for (const userTreeReg of userTreeRegs) {
        await userTreeReg.deleteOne();
      }
  
      // delete event model for the same
    } catch (error: any) {
      console.log(error);
      res.status(status.error).send();
    }
  };

  export const getEvents = async (req: Request, res: Response) => {
    const { offset, limit } = getOffsetAndLimitFromRequest(req);
    let filters: any = {};
    if (req.query?.name) {
      filters["name"] = new RegExp(req.query?.name.toString(), "i");
    }
    if (req.query?.type) {
      filters["type"] = new RegExp(req.query?.type.toString(), "i");
    }
    try {
      let result = await EventModel.find(filters).skip(offset).limit(limit);
      res.status(status.success).send(result);
    } catch (error: any) {
      res.status(status.error).json({
        status: status.error,
        message: error.message,
      });
    }
  };
  
  export const deleteEvent = async (req: Request, res: Response) => {
    try {
      let resp = await EventModel.findByIdAndDelete(req.params.id).exec();
      console.log("Delete event Response for id: %s", req.params.id, resp);
  
      res.status(status.success).json({
        message: "Event deleted successfully",
      });
    } catch (error: any) {
      res.status(status.bad).send({ error: error.message });
    }
  };
  
  export const addCorpEvent = async (req: Request, res: Response) => {
    const fields = req.body;
    let saplingids = fields.sapling_ids.split(/[ ,]+/);
  
    if (!fields.event_name || !fields.event_link || !fields.long_desc) {
      res.status(status.bad).send({ error: "Required fields are missing" });
      return;
    }
    try {
      let tree_ids: string[] = [];
      let logoUrls: string[] = [];
      // Logo images
      if (req.body.logos !== undefined) {
        if (req.body.logos.length > 0) {
          let logos = req.body.logos.split(",");
          for (const image of logos) {
            const location = await uploadHelper.UploadFileToS3(image, "logos");
            if (location !== "") {
              logoUrls.push(location);
            }
          }
        }
      }
  
      let headerImageUrls: string[] = [];
      // Header Image
      if (req.body.header_img !== undefined) {
        if (req.body.header_img.length > 0) {
          let headerImages = req.body.header_img.split(",");
          for (const image of headerImages) {
            const location = await uploadHelper.UploadFileToS3(image, "logos");
            if (location !== "") {
              headerImageUrls.push(location);
            }
          }
        }
      }
  
      let memoryImageUrls: string[] = [];
      // Memories for the visit
      if (req.body.memoryimages !== undefined) {
        if (req.body.memoryimages.length > 0) {
          let memoryImages = req.body.memoryimages.split(",");
          for (const image of memoryImages) {
            const location = await uploadHelper.UploadFileToS3(image, "memories");
            if (location !== "") {
              memoryImageUrls.push(location);
            }
          }
        }
      }
  
      for (let i = 0; i < saplingids.length; i++) {
        let tree = await TreeModel.findOne({ sapling_id: saplingids[i] });
        if (tree) {
          tree_ids.push(tree._id.toString());
        }
      }
  
      let event_model = new corpEventModel({
        event_link: req.body.event_link,
        event_name: req.body.event_name,
        tree_ids: tree_ids,
        plot_id: req.body.plot_id,
        title: req.body.title,
        logo: logoUrls,
        short_desc: req.body.short_desc,
        long_desc: req.body.long_desc,
        album: memoryImageUrls,
        header_img: headerImageUrls,
        num_people: req.body.num_people ? req.body.num_people : 1,
        date_added: req.body.date_org ? new Date(req.body.date_org) : new Date().toISOString(),
      });
      let result = await event_model.save();
      res.status(status.created).send({
        result: result,
      });
    } catch (error: any) {
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
        { $skip: offset },
        { $limit: limit },
      ]);
  
    
      res.status(status.success).json({
        event: corpEvent,
      });
    } catch (error: any) {
      res.status(status.bad).send({ error: error.message });
      return;
    }
  };

  export const updateCorpEvent = async (req: Request, res: Response) => {
    try {
      const eventId = req.params.id;
      const fields = req.body;
  
      // Fetch existing event document
      let event = await corpEventModel.findById(eventId);
      if (!event) {
        res.status(status.notfound).send({ error: "Event not found" });
        return;
      }
  
      // Process image uploads to S3
      let logoUrls = "";
      if (fields.logos) {
        const logos = fields.logos.split(",");
        logoUrls = await uploadHelper.UploadFileToS3(logos, "logos");
        event.logo = [logoUrls];
      }
  
      let headerImgUrl = "";
      if (fields.header_img) {
        const headerImg = fields.header_img.split(",");
        headerImgUrl = await uploadHelper.UploadFileToS3(headerImg, "logos");
        event.header_img = headerImgUrl;
      }
  
      let memoryImgUrls = "";
      if (fields.memoryimages) {
        const memoryImages = fields.memoryimages.split(",");
        memoryImgUrls = await uploadHelper.UploadFileToS3(memoryImages, "memories");
        event.album = [memoryImgUrls];
      }
  
      if (fields.event_link) event.event_link = fields.event_link;
      if (fields.event_name) event.event_name = fields.event_name;
      if (fields.sapling_ids) {
        const saplingIds = fields.sapling_ids.split(/[ ,]+/);
        const tree_ids = [];
        for (let i = 0; i < saplingIds.length; i++) {
          let tree = await TreeModel.findOne({ sapling_id: saplingIds[i] });
          if (tree) {
            tree_ids.push(tree._id);
          }
        }
        event.tree_ids = tree_ids;
      }
      if (fields.plot_id) event.plot_id = new mongoose.Types.ObjectId(fields.plot_id);
      if (fields.title) event.title = fields.title;
      if (fields.short_desc) event.short_desc = fields.short_desc;
      if (fields.long_desc) event.long_desc = fields.long_desc;
      if (fields.num_people) event.num_people = fields.num_people;
  
      // Save the updated event document
      const updatedEvent = await event.save();
      res.status(status.success).send({ event: updatedEvent });
    } catch (error: any) {
      console.error("Corp event update error:", error);
      res.status(status.error).send({ error: error.message });
    }
  };
  
  export const deleteCorpEvent = async (req: Request, res: Response) => {
    try {
      let resp = await corpEventModel.findByIdAndDelete(req.params.id).exec();
      console.log("Delete corp event Response for id: %s", req.params.id, resp);
  
      res.status(status.success).json({
        message: "Corp event deleted successfully",
      });
    } catch (error: any) {
      res.status(status.bad).send({ error: error.message });
    }
  };