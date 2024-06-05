import mongoose from "mongoose";
import { Request, Response } from "express";
import connect from "../services/mongo";
import { getOffsetAndLimitFromRequest } from "./helper/request";
import { status } from "../helpers/status";

import TreeModel from "../models/tree";
import UserTreeModel from "../models/userprofile";
import OrgModel from "../models/org";
import UserModel from "../models/user";
import DeletedUserTreeModel from "../models/deleteduserprofile";

import * as userHelper from "./helper/users"
import * as uploadHelper from "./helper/uploadtos3"
import * as csvHelper from "./helper/uploadtocsv"


export const getAllProfile = async (req: Request, res: Response) => {
  const {offset, limit } = getOffsetAndLimitFromRequest(req);
  try {
    let profiles = await UserTreeModel.aggregate([
      {
        $lookup: {
          from: "users",
          localField: "user",
          foreignField: "_id",
          as: "user",
        },
      },
      {
        $lookup: {
          from: "trees",
          localField: "tree",
          foreignField: "_id",
          as: "tree",
        },
      },
      {
        $unwind: {
          path: "$user",
          preserveNullAndEmptyArrays: true,
        },
      },
      {
        $unwind: {
          path: "$tree",
          preserveNullAndEmptyArrays: true,
        },
      },
      {
        $lookup: {
          from: "plots",
          localField: "tree.plot_id",
          foreignField: "_id",
          as: "plot",
        },
      },
      {
        $lookup: {
          from: "tree_types",
          localField: "tree.tree_id",
          foreignField: "_id",
          as: "treetype",
        },
      },
      {
        $unwind: {
          path: "$treetype",
          preserveNullAndEmptyArrays: true,
        },
      },
      {
        $unwind: {
          path: "$plot",
          preserveNullAndEmptyArrays: true,
        },
      },
      {
        $project: {
          "plot.name": 1,
          "user.name": 1,
          "user.email": 1,
          "user.phone": 1,
          "user.date_added": 1,
          "user.userid": 1,
          date_added: 1,
          "tree.sapling_id": 1,
          "treetype.name": 1,
        },
      },
      {
        $skip: offset
      },
      {
        $limit: limit,
      },
    ]);
    res.status(status.success).json({
      result: profiles,
    });
  } catch (error: any) {
    res.status(status.error).json({
      status: status.error,
      message: error.message,
    });
  }
};

export const getUserProfile = async  (req: Request, res: Response) => {
  if (!req.query.userid) {
    res.status(status.bad).send({ error: "User ID required" });
    return;
  }
   
  try {
      const mongoUserId = new mongoose.Types.ObjectId(req.query.userid.toString());
      const usertrees = await getUserProfilePipeline(mongoUserId);
      res.status(status.success).json({
        usertrees: usertrees,
      });
  } catch (error: any) {
      res.status(status.bad).send({ error: error.message });
      return;
  }
};

export const getProfile = async  (req: Request, res: Response) => {
  if (!req.query.id) {
    res.status(status.bad).send({ error: "Sapling ID required" });
    return;
  }

  try {
    // const usertrees = await getUserAndTreesFromSapling(req.query.id as string);
    let tree = await TreeModel.findOne({ sapling_id: req.query.id });
    if (tree === null) {
      throw new Error("Sapling ID not found");
    }

    let user = await UserTreeModel.findOne({ tree: tree},{user : 1})
    if (user === null) {
      throw new Error("User not found");
    }
    let usertrees = await UserTreeModel.aggregate([
      {
        $match: {
          user: user.user,
        },
      },
      {
        $lookup: {
          from: "users",
          localField: "user",
          foreignField: "_id",
          pipeline: [
            {
              $project: {
                name:1,
                _id: 1
              }
            }
          ],
          as: "user",
        },
      },
      {
        $unwind: "$user",
      },
      {
        $lookup: {
          from: "trees",
          localField: "tree",
          foreignField: "_id",
          pipeline: [
            {
              $project: {
                sapling_id:1,
                image:1,
                location:1,
                tree_id:1,
                plot_id:1,
                event_type: 1,
                link: 1,
                mapped_to: 1,
                desc: 1
              }
            }
          ],
          as: "tree",
        },
      },
      {
        $unwind: "$tree",
      },
      {
        $lookup: {
          from: "tree_types",
          localField: "tree.tree_id",
          foreignField: "_id",
          pipeline: [
            {
              $project: {
                name:1,
                image:1,
                scientific_name:1,
                _id:0
              }
            }
          ],
          as: "tree.tree_type",
        },
      },
      {
        $unwind: "$tree.tree_type",
      },
      {
        $lookup: {
          from: "plots",
          localField: "tree.plot_id",
          foreignField: "_id",
          pipeline: [
            {
              $project: {
                name:1,
                boundaries:1,
                _id:0
              }
            }
          ],
          as: "tree.plot",
        },
      },
      {
        $unwind: "$tree.plot",
      },
      {
        $lookup: {
          from: "organizations",
          localField: "orgid",
          foreignField: "_id",
          pipeline: [
            {
              $project: {
                name:1,
                _id:0
              }
            }
          ],
          as: "orgid",
        },
      },
      {
        $unwind: "$orgid",
      },
      {
        $lookup: {
          from: "users",
          localField: "donated_by",
          foreignField: "_id",
          pipeline: [
            {
              $project: {
                name:1,
                _id:1
              }
            }
          ],
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
          "_id": 0,
          "tree._id": 0,
          "tree.tree_id": 0,
          "tree.plot_id": 0,
        },
      },
    ]);

    res.status(status.success).json({
      usertrees: usertrees,
    });
  } catch (error: any) {
    res.status(status.bad).send({ error: error.message });
    return;
  }
};

export const getProfileById = async  (req: Request, res: Response) => {
  if (!req.query.id) {
    res.status(status.bad).send({ error: "Sapling ID required" });
    return;
  }

  try {
    let tree = await TreeModel.findOne({ _id: req.query.id });
    if (tree === null) {
      throw new Error("Sapling ID not found");
    }

    let user = await UserTreeModel.findOne({ tree: tree }).populate("user", {
      _id: 1,
      name: 1,
      org: 1,
    });

    if (!user) {
      throw new Error("No user found for sapling Id");
    }

    let usertrees = await UserTreeModel.find({ user: user._id })
      .populate({ path: "tree", populate: { path: "tree_id" } })
      .populate({ path: "tree", populate: { path: "plot_id" } });

    res.status(status.success).json({
      user: user,
      trees: usertrees,
    });
  } catch (error: any) {
    res.status(status.bad).send({ error: error.message });
    return;
  }
};

export const addUserTree = async (sapling_id: string, req: Request, res: Response) => {
  try {
    let tree = await TreeModel.findOne({ sapling_id: sapling_id });
    if (tree === null) {
      res.status(status.notfound).send({ error: "Tree ID not found!" });
      return;
    }

    let usertree = await UserTreeModel.findOne({ tree: tree });
    if (usertree !== null) {
      res
        .status(status.duplicate)
        .send({ error: "Profile already exists for same Tree ID!" });
      return;
    }

    // Get the user
    let userDoc = userHelper.getUserDocumentFromRequestBody(req.body);
    let user = await UserModel.findOne({userid: userDoc.userid});
    if (!user) {
      user = await userDoc.save();
    }

    // Upload images to S3
    let userImageUrls = []
    let memoryImageUrls = []

    // User Profile images
    if (req.body.userimages !== undefined) {
      if (req.body.userimages.length > 0) {
        let userImages = req.body.userimages.split(",");
        for (const image in userImages) {
          const location = await uploadHelper.UploadFileToS3(userImages[image], "users");
          if (location != "") {
            userImageUrls.push(location);
          }
        }
      }
    }

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

    // if (req.body.albumimages !== undefined && req.body.albumimages.length > 0) {
    //   mimageurl = req.body.albumimages.split(",");
    // }

    let user_tree_data = new UserTreeModel({
      tree: tree.id,
      user: user?.id,
      profile_image: userImageUrls,
      memories: memoryImageUrls,
      orgid: req.body.org
        ? new mongoose.Types.ObjectId(req.body.org)
        : new mongoose.Types.ObjectId("61726fe62793a0a9994b8bc2"),
      donated_by: req.body.donor
        ? new mongoose.Types.ObjectId(req.body.donor)
        : null,
      plantation_type: req.body.plantation_type
        ? req.body.plantation_type
        : null,
      gifted_by: req.body.gifted_by ? req.body.gifted_by : null,
      planted_by: req.body.planted_by ? req.body.planted_by : null,
      date_added: new Date().toISOString(),
    });

    let user_tree_reg_res;
    let tree_update;
    try {
      user_tree_reg_res = await user_tree_data.save();
      if(req.body.desc) {
        tree_update = await TreeModel.updateOne({sapling_id: sapling_id},  { $set: { desc: req.body.desc } })
      }
    } catch (error: any) {
      res.status(status.error).json({
        error,
      });
    }

    // Fetch some info to be saved in CSV
    let regInfo = await tree.populate({
      path: "plot_id tree_id",
    });

    let org = await OrgModel.find({
      _id: req.body.org ? req.body.org : "61726fe62793a0a9994b8bc2",
    });
    let donor = "";
    if (req.body.donor) {
      let dUser = await UserModel.findOne({ _id: req.body.donor });
      if (dUser) donor = dUser.name;
    }

    // Save the info into the sheet
    let err;
    try {
      await csvHelper.UpdateUserTreeCsv(
        {
          name: req.body.name,
          email: req.body.email,
          dob: req.body.dob,
          contact: req.body.contact,
          date_added: new Date().toISOString(),
        },
        regInfo,
        tree.sapling_id,
        userImageUrls,
        memoryImageUrls,
        org,
        donor
      );
    } catch (error: any) {
      res.status(status.error).json({
        error,
      });
    }
    return [user_tree_reg_res, err];
  } catch (error: any) {
    return error;
  }
};

export const assignTreeToUser = async  (req: Request, res: Response) => {
  try {
    let user_tree_reg_res = await addUserTree(
      req.body.sapling_id,
      req,
      res
    );
    res.status(status.created).json({
      usertreereg: user_tree_reg_res[0],
      csvupload: "Success",
    });
  } catch (error: any) {
    return;
  }
};

export const assignTreesToUser = async  (req: Request, res: Response) => {
  try {
    let saplingids = req.body.sapling_id.split(/[ ,]+/);
    let user_tree_reg_res;
    console.log(saplingids)
    for (let i = 0; i < saplingids.length; i++) {
      user_tree_reg_res = await addUserTree(saplingids[i], req, res);
    }
    res.status(status.created).json({
      usertreereg: user_tree_reg_res[0],
    });
  } catch (error: any) {
    return;
  }
};

export const unassignTrees = async  (req: Request, res: Response) => {
  if (!req.body.sapling_ids && req.body.sapling_ids.length === 0) {
    res.status(status.bad).send({ error: "Sapling IDs required" });
    return;
  }

  try {

    let trees = await TreeModel.find({ sapling_id: {$in: req.body.sapling_ids} });

    for (let i = 0; i < trees.length; i++) {
      let userTree = await UserTreeModel.findOne({ tree: trees[i] });
      if (!userTree) { continue; }
      let deletedProfile = new DeletedUserTreeModel({
        tree: userTree.tree,
        user: userTree.user,
        profile_image: userTree.profile_image,
        memories: userTree.memories,
        orgid: userTree.orgid,
        donated_by: userTree.donated_by,
        plantation_type: userTree.plantation_type,
        gifted_by: userTree.gifted_by,
        planted_by: userTree.planted_by,
        date_added: userTree.date_added,
        date_deleted: new Date().toISOString()
      });
      await deletedProfile.save();
      await UserTreeModel.deleteOne({ tree: trees[i] })
    }

    res.status(status.success).send();
  } catch (error: any) {
    res.status(status.bad).send({ error: error.message });
    return;
  }
}

export const update = async  (req: Request, res: Response) => {
  res.status(status.bad).json();
  // try {
  //   await UserTreeModel.updateMany(
  //     {},
  //     { $set: { orgid: mongoose.Types.ObjectId("617252192793a0a9994b8bb5") } }
  //   );
  // } catch (error: any) {
  //   console.log(error);
  // }
};

async function getUserAndTreesFromSapling(saplingId: string) {
    const db = await connect();
    const trees = db.collection("trees");
    const pipeline = [
    {
      $match: { sapling_id: saplingId }
    },
    {
      $lookup: {
        from: "users",
        localField: "assignment.user",
        foreignField: "_id",
        as: "user"
      }
    },
    {
      $unwind: { path: "$user", preserveNullAndEmptyArrays: true }
    },
    {
      $lookup: {
        from: "tree_types",
        localField: "tree_id",
        foreignField: "_id",
        as: "tree_type"
      }
    },
    {
      $lookup: {
        from: "plots",
        localField: "plot_id",
        foreignField: "_id",
        as: "plot"
      }
    },
    {
      $lookup: {
        from: "organizations",
        localField: "assignment.orgid",
        foreignField: "_id",
        as: "assignment.organization"
      }
    },
    {
      $lookup: {
        from: "users",
        localField: "assignment.donated_by",
        foreignField: "_id",
        as: "assignment.donated_by_user"
      }
    },
    {
      $lookup: {
        from: "users",
        localField: "mapped_to",
        foreignField: "_id",
        as: "mapped_to_user"
      }
    },
    {
      $addFields: {
        tree_type: { $arrayElemAt: ["$tree_type", 0] },
        plot: { $arrayElemAt: ["$plot", 0] }
      }
    },
    {
      $group: {
        _id: "$user",
        trees: {
          $push: {
            _id: "$_id",
            sapling_id: "$sapling_id",
            image: "$image",
            date_added: "$date_added",
            tags: "$tags",
            location: "$location",
            date_assigned: "$date_assigned",
            mapped_to: "$mapped_to",
            desc: "$desc",
            event_type: "$event_type",
            link: "$link",
            tree_type: "$tree_type",
            plot: "$plot",
            assignment: {
              organization: { $arrayElemAt: ["$assignment.organization", 0] },
              donated_by_user: { $arrayElemAt: ["$assignment.donated_by_user", 0] }
            },
            mapped_to_user: { $arrayElemAt: ["$mapped_to_user", 0] }
          }
        }
      }
    },
    {
      $project: {
        _id: 0,
        user: "$_id",
        trees: 1
      }
    }
    ]

    const result = (await trees.aggregate(pipeline).toArray())[0];
    return result;
}

// async function getUserAndTrees(user: ObjectId) {
//     const db = await connect();
//     const trees = db.collection("trees")
//     console.log(await trees.find({}).limit(10).toArray())
//     return {}
// }

async function getUserProfilePipeline(user: mongoose.Types.ObjectId) {
  let usertrees = await UserTreeModel.aggregate([
    {
      $match: {
        user: user,
      },
    },
    {
      $lookup: {
        from: "users",
        localField: "user",
        foreignField: "_id",
        pipeline: [
          {
            $project: {
              name:1,
              _id: 1
            }
          }
        ],
        as: "user",
      },
    },
    {
      $unwind: "$user",
    },
    {
      $lookup: {
        from: "trees",
        localField: "tree",
        foreignField: "_id",
        pipeline: [
          {
            $project: {
              sapling_id:1,
              image:1,
              location:1,
              tree_id:1,
              plot_id:1,
              event_type: 1,
              link: 1,
              mapped_to: 1,
              desc: 1
            }
          }
        ],
        as: "tree",
      },
    },
    {
      $unwind: "$tree",
    },
    {
      $lookup: {
        from: "tree_types",
        localField: "tree.tree_id",
        foreignField: "_id",
        pipeline: [
          {
            $project: {
              name:1,
              image:1,
              scientific_name:1,
              _id:0
            }
          }
        ],
        as: "tree.tree_type",
      },
    },
    {
      $unwind: "$tree.tree_type",
    },
    {
      $lookup: {
        from: "plots",
        localField: "tree.plot_id",
        foreignField: "_id",
        pipeline: [
          {
            $project: {
              name:1,
              boundaries:1,
              _id:0
            }
          }
        ],
        as: "tree.plot",
      },
    },
    {
      $unwind: "$tree.plot",
    },
    {
      $lookup: {
        from: "organizations",
        localField: "orgid",
        foreignField: "_id",
        pipeline: [
          {
            $project: {
              name:1,
              _id:0
            }
          }
        ],
        as: "orgid",
      },
    },
    {
      $unwind: "$orgid",
    },
    {
      $lookup: {
        from: "users",
        localField: "donated_by",
        foreignField: "_id",
        pipeline: [
          {
            $project: {
              name:1,
              _id:1
            }
          }
        ],
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
        "_id": 0,
        "tree._id": 0,
        "tree.tree_id": 0,
        "tree.plot_id": 0,
      },
    },
  ]);

  return usertrees;
}


/* GraphQL Query for User Tree Reg aggregation
query {
  user_tree_reg(query: { user:{_id:"628fcf2a4e07c243c5bcfc3f"}}) {
    user {
      _id
      name
      email
      userid
    }
    tree {
      _id
      sapling_id
      image
      location {
        coordinates
        type
      }
      tree_id {
        name
        image
        scientific_name
      }
      plot_id
      event_type
      link
      mapped_to
      desc
    }
    orgid
  }
}
*/
