import mongoose from "mongoose";
import { Request, Response } from "express";
import { status } from "../helpers/status";
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

export const getOverallOrgDashboard = async (req: Request, res: Response): Promise<void> => {
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
      { _id: mongoose.Types.ObjectId(req.query.org as string) },
      { name: 1, _id: 0 }
    );
    const result = await UserTreeModel.aggregate([
      {
        $match: {
          orgid: mongoose.Types.ObjectId(req.query.org as string),
          date_added: {
            $gte: new Date(req.query.fromdate as string),
            $lte: new Date(req.query.todate as string),
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
  } catch (error) {
    res.status(status.error).send();
  }
};

export const getOverallPlotDashboard = async (req: Request, res: Response): Promise<void> => {
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
      _id: mongoose.Types.ObjectId(req.query.plot as string),
    });

    const pipeline: any[] = [
      {
        $lookup: {
          from: "trees",
          localField: "tree",
          foreignField: "_id",
          as: "trees",
        },
      },
      { $unwind: "$trees" },
    ];

    if (req.query.link) {
      pipeline.push({
        $match: {
          "trees.plot_id": mongoose.Types.ObjectId(plot?._id),
          "trees.link": req.query.link,
          date_added: {
            $gte: new Date(req.query.fromdate as string),
            $lte: new Date(req.query.todate as string),
          },
        },
      });
    } else {
      pipeline.push({
        $match: {
          "trees.plot_id": mongoose.Types.ObjectId(plot?._id),
          date_added: {
            $gte: new Date(req.query.fromdate as string),
            $lte: new Date(req.query.todate as string),
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

    const result = await UserTreeModel.aggregate(pipeline);

    res.status(status.success).send({
      result: result,
      plotname: plot?.name,
    });
  } catch (error) {
    res.status(status.error).send();
  }
};

export const getBirthdayEvent = async (req: Request, res: Response): Promise<void> => {
  const id = req.query.id as string;
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

export const addEvents = async (req: Request, res: Response): Promise<void> => {
  const fields = req.body;
  const saplingids = fields.sapling_id.split(/[ ,]+/);
  let mimageurl;
  let userimages;
  let donor;

  try {
    if (fields.type === "1" || fields.type === "2" || fields.type === "3") {
      const user_tree_reg_ids: mongoose.Types.ObjectId[] = [];

      // Add user to the database if not exists
      const user = await userHelper.addUser(req, res);

      // Memory image urls
      if (fields.albumimages && fields.albumimages.length > 0) {
        mimageurl = fields.albumimages.split(",");
      }

      // User Profile images
      if (fields.userimages && fields.userimages.length > 0) {
        userimages = fields.userimages.split(",");
        for (const image of userimages) {
          await uploadHelper.UploadFileToS3(image, "users");
        }
      }

      const s3urlprofile = "https://14treesplants.s3.ap-south-1.amazonaws.com/users/";
      const uimageurl = userimages ? userimages.map((x: string) => s3urlprofile + x) : "";

      if (fields.donor) {
        const dUser = await UserModel.findOne({ _id: fields.donor });
        donor = dUser?.name;
      }

      for (const saplingid of saplingids) {
        const tree = await TreeModel.findOne({ sapling_id: saplingid });
        const user_tree_data = new UserTreeModel({
          tree: tree?.id,
          user: user.id,
          profile_image: uimageurl,
          memories: mimageurl,
          orgid: fields.org ? mongoose.Types.ObjectId(fields.org) : mongoose.Types.ObjectId("61726fe62793a0a9994b8bc2"),
          donated_by: fields.donor ? mongoose.Types.ObjectId(fields.donor) : null,
          gifted_by: fields.gifted_by || null,
          planted_by: fields.planted_by || null,
          date_added: new Date().toISOString(),
        });

        const user_tree_reg_res = await user_tree_data.save();
        if (fields.desc) {
          await TreeModel.updateOne(
            { sapling_id: saplingid },
            { $set: { desc: fields.desc } }
          );
        }
        user_tree_reg_ids.push(user_tree_reg_res._id);
      }

      const link = Math.random().toString(36).slice(2, 10);
      const event_model = new EventModel({
        assigned_to: user._id,
        assigned_by: fields.donor,
        user_trees: user_tree_reg_ids,
        plot_id: fields.plot_id,
        type: fields.type,
        link: link,
        desc: fields.desc || "",
        date: new Date().toISOString(),
      });

      const result = await event_model.save();
      res.status(status.created).send({ result });
    }
  } catch (error) {
    console.log(error);
    res.status(status.error).send();
  }
};

export const addCorpEvent = async (req: Request, res: Response): Promise<void> => {
  const fields = req.body;
  const saplingids = fields.sapling_ids.split(/[ ,]+/);

  if (!fields.event_name || !fields.event_link || !fields.long_desc) {
    res.status(status.bad).send({ error: "Required fields are missing" });
    return;
  }

  try {
    const tree_ids: mongoose.Types.ObjectId[] = [];
    let logos;
    let header_img;

    // Logo images
    if (fields.logos && fields.logos.length > 0) {
      logos = fields.logos.split(",");
      for (const image of logos) {
        await uploadHelper.UploadFileToS3(image, "logos");
      }
    }

    // Header Image
    if (fields.header_img && fields.header_img.length > 0) {
      header_img = fields.header_img.split(",");
      for (const image of header_img) {
        await uploadHelper.UploadFileToS3(image, "logos");
      }
    }

    const s3logos = "https://14treesplants.s3.ap-south-1.amazonaws.com/logos/";
    const logourl = logos ? logos.map((x: string) => s3logos + x) : "";
    const headerimgurl = header_img ? s3logos + header_img[0] : "";

    let memoryimages;
    // Memories for the visit
    if (fields.memoryimages && fields.memoryimages.length > 0) {
      memoryimages = fields.memoryimages.split(",");
      for (const image of memoryimages) {
        await uploadHelper.UploadFileToS3(image, "memories");
      }
    }

    const s3urlmemories = "https://14treesplants.s3.ap-south-1.amazonaws.com/memories/";
    const mimageurl = memoryimages ? memoryimages.map((x: string) => s3urlmemories + x) : "";

    for (const saplingid of saplingids) {
      const tree = await TreeModel.findOne({ sapling_id: saplingid });
      tree_ids.push(tree?._id);
    }

    const event_model = new corpEventModel({
      event_link: fields.event_link,
      event_name: fields.event_name,
      tree_ids,
      plot_id: mongoose.Types.ObjectId(fields.plot_id),
      title: fields.title,
      logo: logourl,
      short_desc: fields.short_desc,
      long_desc: fields.long_desc,
      album: mimageurl,
      header_img: headerimgurl,
      num_people: fields.num_people || 1,
      date_added: fields.date_org ? new Date(fields.date_org) : new Date().toISOString(),
    });

    const result = await event_model.save();
    res.status(status.created).send({ result });
  } catch (error) {
    console.log(error);
    res.status(status.error).send();
  }
};

export const getCorpEvent = async (req: Request, res: Response): Promise<void> => {
  if (!req.query.event_id) {
    res.status(status.bad).send({ error: "Event ID required" });
    return;
  }

  try {
    const corpEvent = await corpEventModel.aggregate([
      {
        $match: {
          event_link: req.query.event_id as string,
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
  }
};
