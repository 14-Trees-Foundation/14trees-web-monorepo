import { TreeUpdate as TreeUpdatePhoto } from '../models/tree_update_photos'
import { Request, Response } from 'express';

// export const addPhotoUpdate = async (req: Request, res: Response): Promise<void> => {
//   try {
//     if (!req.files) {
//       throw new Error("An Image is required");
//     }
//     if (!req.body.sapling_id) {
//       throw new Error("Sapling ID required");
//     }
//   } catch (error) {
//     res.status(status.bad).send({ error: error.message });
//     return;
//   }

//   // Upload images to S3
//   let imageUrl = "";
//   if (req.files[0]) {
//     imageUrl = await uploadHelper.UploadFileToS3(req.files[0].filename, "tree_update");
//   }

//   try {
//     const tree = await Tree.findOne({ where: { sapling_id: req.body.sapling_id } });
//     if (!tree) {
//       res.status(status.bad).send({ error: "Sapling_id not found!" });
//       return;
//     } else {
//       let date = new Date().toISOString().slice(0, 10);
//       if (req.body.date_added) {
//         date = req.body.date_added;
//       }
//       const tree_update = await TreeUpdatePhoto.findOne({ where: { tree_id: tree.id } });

//       if (!tree_update) {
//         const treeUpdate = await TreeUpdatePhoto.create({
//           tree_id: tree.id,
//           photo_update: [
//             {
//               image: imageUrl,
//               date_added: date,
//             },
//           ],
//         });

//         res.status(status.created).send({
//           update: treeUpdate,
//         });
//       } else {
//         const resp = await TreeUpdatePhoto.update(
//           { tree_id: tree.id },
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