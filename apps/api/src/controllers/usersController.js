const { errorMessage, successMessage, status } = require("../helpers/status");
const UserModel = require("../models/user");
const UserTreeModel = require("../models/userprofile");
const userHelper = require("./helper/users");

module.exports.addUser = async (req, res) => {
  try {
    if (!req.body.name) {
      throw new Error("User name is required");
    }
  } catch (error) {
    res.status(status.bad).send({ error: error.message });
    return;
  }

  try {
    let result = await userHelper.addUser(req, res);
    res.status(status.created).json({
      name: result.name,
      contact: result.phone,
      email: result.email,
    });
  } catch (error) {
    res.status(status.duplicate).json({
      status: status.duplicate,
      message: error.message,
    });
  }
};

module.exports.getUser = async (req, res) => {
  try {
    if (!req.query.email || !req.query.name) {
      throw new Error("Name and Email is required");
    }
  } catch (error) {
    res.status(status.bad).send({ error: error.message });
    return;
  }

  let userid = req.query.name.toLowerCase() + req.query.email.toLowerCase();
  userid = userid.replace(/[^A-Z0-9@.]+/gi, "");

  try {
    let result = await UserModel.findOne({ userid: userid });
    if (result === null) {
      res.status(status.notfound).send();
    } else {
      let lastProfile = await UserTreeModel.find(
        { user: result._id },
        { _id: 0 },
      )
        .populate({
          path: "tree",
          select: "sapling_id date_added -_id",
          populate: { path: "tree_id", select: "name -_id" },
        })
        .select("tree");
      res.status(status.success).json({
        user: result,
        tree: lastProfile,
      });
    }
  } catch (error) {
    res.status(status.error).json({
      status: status.error,
      message: error.message,
    });
  }
};
