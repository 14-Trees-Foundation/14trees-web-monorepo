const { status } = require("../helpers/status");
const AlbumModel = require("../models/albums");
const TreeModel = require("../models/tree");
const UserModel = require("../models/user");

const csvhelper = require("./helper/uploadtocsv");
const uploadHelper = require("./helper/uploadtos3");
const mongoose = require("mongoose");
const { addUser } = require("./helper/users");

module.exports.createAlbum = async (req, res) => {
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

    let imagesAll;

    if (req.body.files !== undefined) {
      if (req.body.files.length > 0) {
        imagesAll = req.body.files.split(",");
        for (const image in imagesAll) {
          await uploadHelper.UploadFileToS3(
            imagesAll[image],
            "albums",
            album_name
          );
        }
      }
    }

    const s3urlmemories =
      "https://14treesplants.s3.ap-south-1.amazonaws.com/memories/" +
      album_name +
      "/";
    let mimageurl =
      imagesAll !== undefined ? imagesAll.map((x) => s3urlmemories + x) : "";

    const album = new AlbumModel({
      user_id: user[0].id,
      album_name: album_name,
      images: mimageurl,
      date_added: date,
      status: "active",
    });

    try {
      let result = await album.save();
      res.status(status.created).send({
        albums: result,
      });
    } catch (error) {
      res.status(status.error).send({
        error: error,
      });
      return;
    }
  } catch (error) {
    res.status(status.error).json({
      status: status.error,
      message: error.message,
    });
  }
};

module.exports.deleteAlbum = async (req, res) => {
  try {
    let user = await UserModel.find({ user_id: req.body.user_id });
    let album = await AlbumModel.find({
      user_id: user._id,
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
    } catch (error) {
      res.status(status.error).send({
        error: error,
      });
      return;
    }
  } catch (error) {
    res.status(status.error).json({
      status: status.error,
      message: error.message,
    });
  }
};

module.exports.getAlbums = async (req, res) => {
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
  } catch (error) {
    res.status(status.error).json({
      status: status.error,
      message: error.message,
    });
  }
};

module.exports.getTrees = async (req, res) => {
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
  } catch (error) {
    res.status(status.error).json({
      status: status.error,
      message: error.message,
    });
  }
};

module.exports.updateTrees = async (req, res) => {
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
  } catch (error) {
    res.status(status.error).json({
      status: status.error,
      message: error.message,
    });
  }
};

module.exports.addTrees = async (req, res) => {
  const fields = req.body;
  let email_id = fields.email;
  let saplingids = fields.sapling_id.split(/[ ,]+/);

  const filtered_saplings = saplingids.filter(function (el) {
    return el;
  });

  let user = await UserModel.findOne({ email: email_id });
  if (user === null) {
    try {
      user = await addUser(req, res);
    } catch (error) {
      res.status(status.error).send(error);
    }
  }

  try {
    for (let i = 0; i < filtered_saplings.length; i++) {
      try {
        let result = await TreeModel.updateOne(
          { sapling_id: filtered_saplings[i] },
          {
            $set: {
              mapped_to: user.id,
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
      } catch (error) {
        res.status(status.error).send({
          error: error,
        });
        return;
      }
    }
    res.status(status.created).send();
  } catch (error) {
    res.status(status.error).send({
      error: error,
    });
  }
};

module.exports.getUserTreeCount = async (req, res) => {
  try {
    let result = await TreeModel.aggregate([
      {
        $group: {
          _id: {
            user: "$mapped_to",
            plot: "$plot_id",
          },
          count: { $sum: 1 },
          tree_id: { $push: "$_id" },
        },
      },
      {
        $lookup: {
          from: "users",
          localField: "_id.user",
          foreignField: "_id",
          pipeline: [
            {
              $project: {
                name: 1,
                email: 1,
                _id: 0,
              },
            },
          ],
          as: "user",
        },
      },
      { $unwind: "$user" },
      {
        $lookup: {
          from: "plots",
          localField: "_id.plot",
          foreignField: "_id",
          pipeline: [
            {
              $project: {
                name: 1,
                plot_id: 1,
                _id: 0,
              },
            },
          ],
          as: "plot",
        },
      },
      {
        $lookup: {
          from: "user_tree_regs",
          let: { id: "$tree_id" },
          pipeline: [
            {
              $match: {
                $expr: { $in: ["$tree", "$$id"] },
              },
            },
            { $count: "count" },
          ],
          as: "matched",
        },
      },
      { $unwind: { path: "$matched", preserveNullAndEmptyArrays: true } },
      { $unwind: "$plot" },
      { $project: { _id: 0 } },
    ]);

    var defaultObj = result.reduce(
      (m, o) => (Object.keys(o).forEach((key) => (m[key] = 0)), m),
      {}
    );
    result = result.map((e) => Object.assign({}, defaultObj, e));
    res.status(status.success).send(result);
  } catch (error) {
    res.status(status.error).json({
      message: error.message,
    });
  }
};
