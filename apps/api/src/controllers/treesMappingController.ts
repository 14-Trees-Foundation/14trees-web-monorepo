import { status } from "../helpers/status";
import AlbumModel from "../models/albums";
import TreeModel from "../models/tree";
import UserModel from "../models/user";
import PlotModel from "../models/plot";

import * as uploadHelper from "./helper/uploadtos3";
import { getUserDocumentFromRequestBody } from "./helper/users";
import { getOffsetAndLimitFromRequest } from "./helper/request";
import { getQueryExpression } from "./helper/filters";
import { Request, Response } from "express";
import UserTreeCountModel from "../models/user_tree_count";

export const createAlbum = async (req: Request, res: Response) => {
  let email = req.params["email"];
  try {
    let user = await UserModel.find({ email: email, name: req.body.name });
    if (user === null || user.length === 0) {
      res
        .status(status.notfound)
        .send({ error: "User not registered! Contact Admin." });
      return;
    }

    if (req.body.album_name === undefined) {
      res.status(status.bad).send({ error: "Album name required!." });
      return;
    }

    let date = new Date().toISOString().slice(0, 10);
    let album_name =
      req.body.name.split(" ")[0] + "/" + date + "/" + req.body.album_name;

    let memoryImageUrls = [];
    if (req.body.files !== undefined) {
      if (req.body.files.length > 0) {
        let imagesAll = req.body.files.split(",");
        for (const image in imagesAll) {
          const location = await uploadHelper.UploadFileToS3(imagesAll[image],"albums",album_name);
          if (location !== "") {
            memoryImageUrls.push(location);
          }
        }
      }
    }

    const album = new AlbumModel({
      user_id: user[0].id,
      album_name: album_name,
      images: memoryImageUrls,
      date_added: date,
      status: "active",
    });

    try {
      let result = await album.save();
      res.status(status.created).send({
        albums: result,
      });
    } catch (error: any) {
      res.status(status.error).send({
        error: error,
      });
      return;
    }
  } catch (error: any) {
    res.status(status.error).json({
      status: status.error,
      message: error.message,
    });
  }
};

export const deleteAlbum = async (req: Request, res: Response) => {
  try {
    let user = await UserModel.findOne({ user_id: req.body.user_id });
    let album = await AlbumModel.find({
      user_id: user?._id,
      album_name: req.body.album_name,
    });

    if (!album) {
      res.status(status.notfound).send({ error: "Album not found." });
      return;
    }

    try {
      let result = await AlbumModel.updateOne(
        { album_name: req.body.album_name },
        { $set: { status: "unused" } }
      );
      res.status(status.nocontent).send();
      return;
    } catch (error: any) {
      res.status(status.error).send({
        error: error,
      });
      return;
    }
  } catch (error: any) {
    res.status(status.error).json({
      status: status.error,
      message: error.message,
    });
  }
};

export const getAlbums = async (req: Request, res: Response) => {
  let email = req.params["email"];
  try {
    let user = await UserModel.find({ email: email });
    if (user === null || user.length === 0) {
      res
        .status(status.notfound)
        .send({ error: "User not registered! Contact Admin." });
      return;
    }

    let albums = await AlbumModel.find({
      user_id: user[0]._id,
      status: "active",
    });

    res.status(status.success).send({
      albums: albums,
    });
  } catch (error: any) {
    res.status(status.error).json({
      status: status.error,
      message: error.message,
    });
  }
};

export const getMappedTrees = async (req: Request, res: Response) => {
  let email = req.params["email"];
  try {
    let user = await UserModel.find({ email: email });
    if (user === null || user.length === 0) {
      res
        .status(status.notfound)
        .send({ error: "User not registered! Contact Admin." });
      return;
    }

    let trees = await TreeModel.aggregate([
      {
        $match: {
          mapped_to: user[0]._id,
        },
      },
      {
        $lookup: {
          from: "tree_types",
          localField: "tree_id",
          foreignField: "_id",
          pipeline: [
            {
              $project: {
                name: 1,
                scientific_name: 1,
                _id: 0,
              },
            },
          ],
          as: "tree",
        },
      },
      {
        $unwind: "$tree",
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
        $unwind: "$plot",
      },
      {
        $lookup: {
          from: "user_tree_regs",
          localField: "_id",
          foreignField: "tree",
          pipeline: [
            {
              $project: {
                user: 1,
                _id: 0,
              },
            },
          ],
          as: "assigned_to",
        },
      },
      {
        $unwind: { path: "$assigned_to", preserveNullAndEmptyArrays: true },
      },
      {
        $lookup: {
          from: "users",
          localField: "assigned_to.user",
          foreignField: "_id",
          pipeline: [
            {
              $project: {
                name: 1,
                _id: 0,
              },
            },
          ],
          as: "user",
        },
      },
      {
        $unwind: { path: "$user", preserveNullAndEmptyArrays: true },
      },
      {
        $project: {
          sapling_id: 1,
          location: 1,
          link: 1,
          event_type: 1,
          tree: 1,
          plot: 1,
          user: 1,
          image: 1,
        },
      },
    ]);

    res.status(status.success).send({
      user: user,
      trees: trees,
    });
  } catch (error: any) {
    res.status(status.error).json({
      status: status.error,
      message: error.message,
    });
  }
};

export const updateEventDataInTrees = async (req: Request, res: Response) => {
  const sapling_ids = req.body.sapling_ids;

  let link = req.body.link ? req.body.link : "";
  let type = req.body.type ? req.body.type : "";
  try {
    for (let i = 0; i < sapling_ids.length; i++) {
      let tree = await TreeModel.updateOne(
        { sapling_id: sapling_ids[i] },
        { $set: { event_type: type, link: link } }
      );
    }
    res.status(status.created).send();
  } catch (error: any) {
    res.status(status.error).json({
      status: status.error,
      message: error.message,
    });
  }
};

export const mapTrees = async (req: Request, res: Response) => {
  const fields = req.body;
  let email_id = fields.email;
  let saplingIds = fields.sapling_id.split(/[ ,]+/);

  const filtered_saplings = saplingIds.filter(function (el: string) {
    return el;
  });
  
  let user = null;
  try {
    user = await UserModel.findOne({ email: email_id });
    if (user === null) {
      let userDoc = getUserDocumentFromRequestBody(req.body);
      user = await userDoc.save();
    }
  } catch (error: any) {
    console.log(error);
    res.status(status.error).send(error);
    return;
  }

  try {
    for (let i = 0; i < filtered_saplings.length; i++) {
      try {
        let result = await TreeModel.updateOne(
          { sapling_id: filtered_saplings[i] },
          {
            $set: {
              mapped_to: user?.id,
              date_assigned: new Date(),
            },
          }
        );
        if (result.modifiedCount === 0) {
          res.status(status.bad).send({
            error: "Tree assignment failed : " + filtered_saplings[i],
          });
          return;
        }
      } catch (error: any) {
        console.log(error);
        res.status(status.error).send({
          error: error,
        });
        return;
      }
    }
    res.status(status.created).send();
  } catch (error: any) {
    console.log(error);
    res.status(status.error).send({
      error: error,
    });
  }
};

export const mapTreesInPlot = async (req: Request, res: Response) => {
  const fields = req.body;
  let email_id = fields.email;
  let plot_id = fields.plot_id;
  let count = fields.count;

  try {
    let user = await UserModel.findOne({ email: email_id });
    if (!user) {
      res.status(status.error).send({error: "user with given email doesn't exists"});
      return;
    }

    let plot = await PlotModel.findOne({ $or: [
      {plot_id: plot_id},
      {_id : plot_id}
    ] });
    if (!plot) {
      res.status(status.error).send({error: "plot with given plot_id doesn't exists"});
      return;
    }

    let trees = await TreeModel.find({
      plot_id: plot._id, 
      $and: [
        {$or: [
          {"mapped_to": {"$exists": false}},
          {"mapped_to": {"$exists": true, "$eq": null}},
        ]},
        {$or: [
          {"date_assigned": {"$exists": false}},
          {"date_assigned": {"$exists": true, "$eq": null}},
        ]}
      ]
    }).limit(count);

    if (trees.length != count) {
      res.status(status.error).send({error: "not enough trees to assign"});
      return;
    }

    for (let i = 0; i < count; i++) {
      trees[i]["mapped_to"] = user._id;
    }

    await TreeModel.bulkSave(trees);
    res.status(status.success).send();
  } catch (error: any) {
    res.status(status.error).send({
      error: error,
    });
  }
};

export const unMapTrees = async (req: Request, res: Response) => {
  const fields = req.body;
  let saplingIds = fields.sapling_ids;

  let failedSaplingIds = []
  for (let i = 0; i < saplingIds.length; i++) {
    try {
      let result = await TreeModel.updateOne(
        { sapling_id: saplingIds[i] },
        {
          $set: {
            mapped_to: null,
            date_assigned: null,
          },
        }
      );
      if (result.modifiedCount === 0) {
        failedSaplingIds.push(saplingIds[i]);
      }
    } catch (error: any) {
      res.status(status.error).send({
        error: error,
      });
      return;
    }
  }
  if (failedSaplingIds.length !== 0) {
    res.status(status.error).send({error: "failed to remove mapping for sapling some sapling ids",  failed_sampling_ids: failedSaplingIds});
    return;
  }
  res.status(status.created).send();
};

export const getUserMappedTreesCount = async (req: Request, res: Response) => {
  const {offset, limit} = getOffsetAndLimitFromRequest(req);
  const filterReq = req.body.filters;
  let filters = {};
  if (filterReq && filterReq.length != 0) {
    if (filterReq[0].columnField === "name") {
      filters = getQueryExpression("user.name", filterReq[0].operatorValue, filterReq[0].value)
    } else if (filterReq[0].columnField === "plot") {
      filters = getQueryExpression("plot.name", filterReq[0].operatorValue, filterReq[0].value)
    }
  }

  // let pipeline: any[] = [
  //   {
  //     $group: {
  //       _id: {
  //         user: "$mapped_to",
  //         plot: "$plot_id",
  //       },
  //       count: { $sum: 1 },
  //       tree_id: { $push: "$_id" },
  //     },
  //   },
  //   {
  //     $lookup: {
  //       from: "users",
  //       localField: "_id.user",
  //       foreignField: "_id",
  //       pipeline: [
  //         {
  //           $project: {
  //             name: 1,
  //             email: 1,
  //             _id: 0,
  //           },
  //         },
  //       ],
  //       as: "user",
  //     },
  //   },
  //   { $unwind: "$user" },
  //   {
  //     $lookup: {
  //       from: "plots",
  //       localField: "_id.plot",
  //       foreignField: "_id",
  //       pipeline: [
  //         {
  //           $project: {
  //             name: 1,
  //             plot_id: 1,
  //             _id: 0,
  //           },
  //         },
  //       ],
  //       as: "plot",
  //     },
  //   },
  //   {
  //     $lookup: {
  //       from: "user_tree_regs",
  //       let: { id: "$tree_id" },
  //       pipeline: [
  //         {
  //           $match: {
  //             $expr: { $in: ["$tree", "$$id"] },
  //           },
  //         },
  //         { $count: "count" },
  //       ],
  //       as: "matched",
  //     },
  //   },
  //   { $unwind: { path: "$matched", preserveNullAndEmptyArrays: true } },
  //   { $unwind: "$plot" },
  // ]

  // if (filters) {
  //   pipeline.push({ $match: filters })
  // }
  // pipeline.push({ $project: { _id: 0 } })
  
  try {
    
    // let countDocPipeline = [...pipeline, {$count: "totalDocuments"}];
    // let countResult = await TreeModel.aggregate(countDocPipeline);
    // let getDocPipeline = [...pipeline, {
    //   $facet: {
    //     paginatedResults: [{ $skip: offset }, { $limit: limit }],
    //     totalCount: [
    //       {
    //         $count: 'count'
    //       }
    //     ]
    //   }
    // }];
    // let result = await TreeModel.aggregate(getDocPipeline);
    const result = await UserTreeCountModel.find(filters).skip(offset).limit(limit);
    const resultCount = await UserTreeCountModel.find(filters).count();
    // console.log(resultCount);
    // var defaultObj = result.reduce(
    //   (m, o) => (Object.keys(o).forEach((key) => (m[key] = 0)), m),
    //   {}
    // );
    // result = result.map((e) => Object.assign({}, defaultObj, e));
    res.status(status.success).send({
      total: resultCount,
      offset: offset,
      result_count: result.length,
      result: result,
    });
  } catch (error: any) {
    res.status(status.error).json({
      message: error.message,
    });
  }
};
