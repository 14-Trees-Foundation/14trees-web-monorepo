import { Request, Response } from "express";
import TreeRepository from "../repo/treeRepo";

const { status } = require("../helpers/status");
const { getOffsetAndLimitFromRequest } = require("./helper/request");
const { getWhereOptions } = require("./helper/filters");

// module.exports.createAlbum = async (req, res) => {
//   let email = req.params["email"];
//   try {
//     let user = await UserModel.find({ email: email, name: req.body.name });
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
//   } catch (error) {
//     res.status(status.error).json({
//       status: status.error,
//       message: error.message,
//     });
//   }
// };

// module.exports.deleteAlbum = async (req, res) => {
//   try {
//     let user = await UserModel.find({ user_id: req.body.user_id });
//     let album = await AlbumModel.find({
//       user_id: user._id,
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
//     } catch (error) {
//       res.status(status.error).send({
//         error: error,
//       });
//       return;
//     }
//   } catch (error) {
//     res.status(status.error).json({
//       status: status.error,
//       message: error.message,
//     });
//   }
// };

// module.exports.getAlbums = async (req, res) => {
//   let email = req.params["email"];
//   try {
//     let user = await UserModel.find({ email: email });
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
//   } catch (error) {
//     res.status(status.error).json({
//       status: status.error,
//       message: error.message,
//     });
//   }
// };

export const getMappedTrees = async (req: Request, res: Response) => {
  const {offset, limit} = getOffsetAndLimitFromRequest(req);
  let email = req.params["email"];
  try {
    const {trees, user} = await TreeRepository.getMappedTrees(email, offset, limit);
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

export const mapTrees = async (req: Request, res: Response) => {
  const fields = req.body;
  const id = fields.id;
  const saplingIds = fields.sapling_ids as string[]
  const mappingType: string = fields.mapped_to

  if (mappingType !== 'user' && mappingType !== 'group') {
    res.status(status.bad).send({
      error: "Mapped to is required(user/group)",
    })
    return;
  }

  const mapped_to: 'user' | 'group' = mappingType === 'user' ? 'user' : 'group';
  try {
    await TreeRepository.mapTrees(mapped_to, saplingIds, id);
    res.status(status.created).send();
  } catch (error: any) {
    res.status(status.error).send({
      error: error,
    });
  }
};

export const mapTreesInPlot = async (req: Request, res: Response) => {
  const fields = req.body;
  const id = fields.id;
  const plotId = fields.plot_id;
  const count = fields.count;
  const mappingType: string = fields.mapped_to

  if (mappingType !== 'user' && mappingType !== 'group') {
    res.status(status.bad).send({
      error: "Mapped to is required(user/group)",
    })
    return;
  }

  const mapped_to: 'user' | 'group' = mappingType === 'user' ? 'user' : 'group';
  try {
    await TreeRepository.mapTreesInPlot(mapped_to, id, plotId, count);
    res.status(status.success).send();
  } catch (error) {
    res.status(status.error).send({
      error: error,
    });
  }
};

export const unMapTrees = async (req: Request, res: Response) => {
    const fields = req.body;
    let saplingIds = fields.sapling_ids;

    await TreeRepository.unMapTrees(saplingIds);
    res.status(status.created).send();
};


export const getUserMappedTreesCount = async (req: Request, res: Response) => {
  const {offset, limit} = getOffsetAndLimitFromRequest(req);
  const filterReq = req.body.filters;
  let filters;
  if (filterReq && filterReq.length != 0) {
    if (filterReq[0].columnField === "name") {
      filters = getWhereOptions("user.name", filterReq[0].operatorValue, filterReq[0].value)
    } else if (filterReq[0].columnField === "plot") {
      filters = getWhereOptions("plot.name", filterReq[0].operatorValue, filterReq[0].value)
    }
  }

  try {
    
    let result = await TreeRepository.getUserTreesCount(offset, limit);
    
    // var defaultObj = result.reduce(
    //   (m, o) => (Object.keys(o).forEach((key) => (m[key] = 0)), m),
    //   {}
    // );
    // result = result.map((e) => Object.assign({}, defaultObj, e));
    res.status(status.success).send(result);
  } catch (error: any) {
    res.status(status.error).json({
      message: error.message,
    });
  }
};
