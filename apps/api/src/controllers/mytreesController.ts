// import { status } from "../helpers/status";
// import  AlbumModel  from "../models/albums"; // Assuming Album is the interface/type for albums
// import Tree  from "../models/tree"; // Assuming Tree is the interface/type for trees
// import User  from "../models/user"; // Assuming User is the interface/type for users
// import { getOffsetAndLimitFromRequest } from "./helper/request";
// import * as userHelper from "./helper/users";
// import * as uploadHelper from "./helper/uploadtos3";


// export const createAlbum = async (req: any,res: any) => {
//   let email = req.params["email"];
//   try {
//     let user = await User.find({ email: email, name: req.body.name });
//     if (user === null || user.length === 0) {
//       res
//         .status(status.notfound)
//         .send({ error: "User not registered! Contact Admin." });
//       return;
//     }

//     if (req.body.album_name === undefined) {
//       res.status(status.bad).send({ error: "Album name required!." });
//       return;
//     }

//     let date = new Date().toISOString().slice(0, 10);
//     let album_name =
//       req.body.name.split(" ")[0] + "/" + date + "/" + req.body.album_name;

//     let memoryImageUrls = [];
//     if (req.body.files !== undefined) {
//       if (req.body.files.length > 0) {
//         let imagesAll = req.body.files.split(",");
//         for (const image in imagesAll) {
//           const location = await uploadHelper.UploadFileToS3(imagesAll[image],"albums",album_name);
//           if (location !== "") {
//             memoryImageUrls.push(location);
//           }
//         }
//       }
//     }

//     const album = new AlbumModel({
//       user_id: user[0].id,
//       album_name: album_name,
//       images: memoryImageUrls,
//       date_added: date,
//       status: "active",
//     });

//     try {
//       let result = await album.save();
//       res.status(status.created).send({
//         albums: result,
//       });
//     } catch (error) {
//       res.status(status.error).send({
//         error: error,
//       });
//       return;
//     }
//   } catch (error: any) {
//     res.status(status.error).json({
//       status: status.error,
//       message: error.message,
//     });
//   }
// };

// export const deleteAlbum = async (req: any,res: any) => {
//   try {
//     let user = await User.find({ user_id: req.body.user_id });
//     let album = await AlbumModel.find({
//       user_id: (user as any)._id,
//       album_name: req.body.album_name,
//     });

//     if (!album) {
//       res.status(status.notfound).send({ error: "Album not found." });
//       return;
//     }

//     try {
//       let result = await AlbumModel.updateOne(
//         { album_name: req.body.album_name },
//         { $set: { status: "unused" } }
//       );
//       res.status(status.nocontent).send();
//       return;
//     } catch (error: any) {
//       res.status(status.error).send({
//         error: error,
//       });
//       return;
//     }
//   } catch (error: any) {
//     res.status(status.error).json({
//       status: status.error,
//       message: error.message,
//     });
//   }
// };

// export const getAlbums = async (req: any,res: any) => {
//   let email = req.params["email"];
//   try {
//     let user = await User.find({ email: email });
//     if (user === null || user.length === 0) {
//       res
//         .status(status.notfound)
//         .send({ error: "User not registered! Contact Admin." });
//       return;
//     }

//     let albums = await AlbumModel.find({
//       user_id: user[0]._id,
//       status: "active",
//     });

//     res.status(status.success).send({
//       albums: albums,
//     });
//   } catch (error: any) {
//     res.status(status.error).json({
//       status: status.error,
//       message: error.message,
//     });
//   }
// };

// export const getTrees = async (req: any,res: any) => {
//   const {offset, limit} = getOffsetAndLimitFromRequest(req);
//   let email = req.params["email"];
//   try {
//     let user = await User.find({ email: email });
//     if (user === null || user.length === 0) {
//       res
//         .status(status.notfound)
//         .send({ error: "User not registered! Contact Admin." });
//       return;
//     }

//     let trees = await Tree.aggregate([
//       {
//         $match: {
//           mapped_to: user[0]._id,
//         },
//       },
//       {
//         $lookup: {
//           from: "tree_types",
//           localField: "tree_id",
//           foreignField: "_id",
//           pipeline: [
//             {
//               $project: {
//                 name: 1,
//                 scientific_name: 1,
//                 _id: 0,
//               },
//             },
//           ],
//           as: "tree",
//         },
//       },
//       {
//         $unwind: "$tree",
//       },
//       {
//         $lookup: {
//           from: "plots",
//           localField: "plot_id",
//           foreignField: "_id",
//           pipeline: [
//             {
//               $project: {
//                 name: 1,
//                 _id: 0,
//               },
//             },
//           ],
//           as: "plot",
//         },
//       },
//       {
//         $unwind: "$plot",
//       },
//       {
//         $lookup: {
//           from: "user_tree_regs",
//           localField: "_id",
//           foreignField: "tree",
//           pipeline: [
//             {
//               $project: {
//                 user: 1,
//                 _id: 0,
//               },
//             },
//           ],
//           as: "assigned_to",
//         },
//       },
//       {
//         $unwind: { path: "$assigned_to", preserveNullAndEmptyArrays: true },
//       },
//       {
//         $lookup: {
//           from: "users",
//           localField: "assigned_to.user",
//           foreignField: "_id",
//           pipeline: [
//             {
//               $project: {
//                 name: 1,
//                 _id: 0,
//               },
//             },
//           ],
//           as: "user",
//         },
//       },
//       {
//         $unwind: { path: "$user", preserveNullAndEmptyArrays: true },
//       },
//       {
//         $project: {
//           sapling_id: 1,
//           location: 1,
//           link: 1,
//           event_type: 1,
//           tree: 1,
//           plot: 1,
//           user: 1,
//           image: 1,
//         },
//       },
//       { $skip: offset },
//       { $limit: limit },
//     ]);

//     res.status(status.success).send({
//       user: user,
//       trees: trees,
//     });
//   } catch (error: any) {
//     res.status(status.error).json({
//       status: status.error,
//       message: error.message,
//     });
//   }
// };

// export const updateTrees = async (req: any,res: any) => {
//   const sapling_ids = req.body.sapling_ids;

//   let link = req.body.link ? req.body.link : "";
//   let type = req.body.type ? req.body.type : "";
//   try {
//     for (let i = 0; i < sapling_ids.length; i++) {
//       let tree = await Tree.updateOne(
//         { sapling_id: sapling_ids[i] },
//         { $set: { event_type: type, link: link } }
//       );
//     }
//     res.status(status.created).send();
//   } catch (error: any) {
//     res.status(status.error).json({
//       status: status.error,
//       message: error.message,
//     });
//   }
// };

// export const addTrees = async (req: any,res: any) => {
//   const fields = req.body;
//   let email_id = fields.email;
//   let saplingids = fields.sapling_id.split(/[ ,]+/);

//   const filtered_saplings = saplingids.filter(function (el:any) {
//     return el;
//   });

//   let user = await User.findOne({ email: email_id });
//   if (user === null) {
//     try {
//       let userDoc = await userHelper.getUserDocumentFromRequestBody(req);
//       user = await userDoc.save();
//     } catch (error) {
//       res.status(status.error).send(error);
//     }
//   }

//   try {
//     for (let i = 0; i < filtered_saplings.length; i++) {
//       try {
//         let result = await Tree.updateOne(
//           { sapling_id: filtered_saplings[i] },
//           {
//             $set: {
//               mapped_to: user?.id,
//               date_assigned: new Date(),
//             },
//           }
//         );
//         if (result.modifiedCount === 0) {
//           res.status(status.bad).send({
//             error: "Tree assignment failed : " + filtered_saplings[i],
//           });
//           return;
//         }
//       } catch (error: any) {
//         res.status(status.error).send({
//           error: error,
//         });
//         return;
//       }
//     }
//     res.status(status.created).send();
//   } catch (error) {
//     res.status(status.error).send({
//       error: error,
//     });
//   }
// };

// export const removeMappedToFromTrees = async (req: any,res: any) => {
//   const fields = req.body;
//   let saplingIds = fields.sapling_id.split(/[ ,]+/);

//   let failedSaplingIds = []
//   for (let i = 0; i < saplingIds.length; i++) {
//     try {
//       let result = await Tree.updateOne(
//         { sapling_id: saplingIds[i] },
//         {
//           $set: {
//             mapped_to: null,
//             date_assigned: null,
//           },
//         }
//       );
//       if (result.modifiedCount === 0) {
//         failedSaplingIds.push(saplingIds[i]);
//       }
//     } catch (error: any) {
//       res.status(status.error).send({
//         error: error,
//       });
//       return;
//     }
//   }
//   if (failedSaplingIds.length !== 0) {
//     res.status(status.error).send({error: "failed to remove mapping for sapling some sapling ids",  failed_sampling_ids: failedSaplingIds});
//     return;
//   }
//   res.status(status.created).send();
// };

// export const getUserTreeCount = async (req: any,res: any) => {
//   const {offset, limit} = getOffsetAndLimitFromRequest(req);
//   try {
//     let result = await Tree.aggregate([
//       {
//         $group: {
//           _id: {
//             user: "$mapped_to",
//             plot: "$plot_id",
//           },
//           count: { $sum: 1 },
//           tree_id: { $push: "$_id" },
//         },
//       },
//       {
//         $lookup: {
//           from: "users",
//           localField: "_id.user",
//           foreignField: "_id",
//           pipeline: [
//             {
//               $project: {
//                 name: 1,
//                 email: 1,
//                 _id: 0,
//               },
//             },
//           ],
//           as: "user",
//         },
//       },
//       { $unwind: "$user" },
//       {
//         $lookup: {
//           from: "plots",
//           localField: "_id.plot",
//           foreignField: "_id",
//           pipeline: [
//             {
//               $project: {
//                 name: 1,
//                 plot_id: 1,
//                 _id: 0,
//               },
//             },
//           ],
//           as: "plot",
//         },
//       },
//       {
//         $lookup: {
//           from: "user_tree_regs",
//           let: { id: "$tree_id" },
//           pipeline: [
//             {
//               $match: {
//                 $expr: { $in: ["$tree", "$$id"] },
//               },
//             },
//             { $count: "count" },
//           ],
//           as: "matched",
//         },
//       },
//       { $unwind: { path: "$matched", preserveNullAndEmptyArrays: true } },
//       { $unwind: "$plot" },
//       { $project: { _id: 0 } },
//       { $skip: offset },
//       { $limit: limit },
//     ]);

//     var defaultObj = result.reduce(
//       (m, o) => (Object.keys(o).forEach((key) => (m[key] = 0)), m),
//       {}
//     );
//     result = result.map((e) => Object.assign({}, defaultObj, e));
//     res.status(status.success).send(result);
//   } catch (error: any) {
//     res.status(status.error).json({
//       message: error.message,
//     });
//   }
// };
