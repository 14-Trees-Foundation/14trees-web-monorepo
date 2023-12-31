const { PondModel, pondUpdate } = require("../models/pond");
const { status } = require("../helpers/status");
const uploadHelper = require("./helper/uploadtos3");
const OnSiteStaff = require("../models/onsitestaff");

module.exports.addPond = async (req, res) => {
  try {
    if (!req.body.pond_name) {
      throw new Error("Pond name is required");
    } else if (!req.body.length && isNaN(parseFloat(req.body.length))) {
      throw new Error("Pond height is required");
    } else if (!req.body.width && isNaN(parseFloat(req.body.width))) {
      throw new Error("Pond width is required");
    } else if (!req.body.depth && isNaN(parseFloat(req.body.depth))) {
      throw new Error("Pond depth is required");
    } else if (!req.body.type) {
      throw new Error(
        "Pond type is required - (Storage/Percolation/Water hole)"
      );
    }
  } catch (error) {
    res.status(status.bad).send({ error: error.message });
    return;
  }

  // get the user name who is logging
  let user = null;
  if (
    req.body.user_id !== "" ||
    req.body.user_id !== undefined ||
    req.body.user_id !== null
  ) {
    user = await OnSiteStaff.findOne({ user_id: req.body.user_id });
  }

  // Tree type object to be saved
  let obj = {
    name: req.body.pond_name,
    plot_id: req.body.plot_code,
    lengthFt: req.body.length,
    depthFt: req.body.depth,
    widthFt: req.body.width,
    user_id: user === null ? null : user,
    type: req.body.type,
    date_added: new Date().toISOString(),
  };
  const pond = new PondModel(obj);

  let pondRes;
  try {
    pondRes = await pond.save();
    res.status(status.created).json({
      pond: pondRes,
    });
  } catch (error) {
    res.status(status.error).json({ error });
  }
};

module.exports.getPonds = async (req, res) => {
  try {
    let result = await PondModel.find({}, { updates: 0 });
    res.status(status.success).send(result);
  } catch (error) {
    res.status(status.error).json({
      status: status.error,
      message: error.message,
    });
  }
};

module.exports.addUpdate = async (req, res) => {
  try {
    if (!req.body.pond_name) {
      throw new Error("Pond name is required");
    } else if (!req.body.levelFt) {
      throw new Error("Water level is required");
    }
  } catch (error) {
    res.status(status.bad).send({ error: error.message });
    return;
  }

  let user = null;
  if (req.body.user_id) {
    user = await OnSiteStaff.findOne({ user_id: req.body.user_id });
  }

  let imageurls = "";
  if (req.files[0]) {
    await uploadHelper.UploadFileToS3(req.files[0].filename, "ponds", req.body.pond_name);
    // Save the urls with S3 location prefixed for each image
    const s3url = "https://14treesplants.s3.ap-south-1.amazonaws.com/ponds/";
    imageurls = s3url + req.body.pond_name + "/" + req.files[0].filename;
  }

  let obj = {
    date: req.body.date === null ? new Date().toISOString() : req.body.date,
    levelFt: req.body.levelFt,
    user: user === null ? null : user,
    images: imageurls,
  };
  try {
    let result = await PondModel.updateOne(
      { name: req.body.pond_name },
      { $push: { updates: obj } }
    );
    res.status(status.success).send(result);
  } catch (error) {
    res.status(status.error).json({ error });
  }
};

module.exports.getHistory = async (req, res) => {
  if (!req.query.pond_name) {
    res.status(status.bad).send({ error: "Pond name required!" });
    return;
  }
  try {
    let result = await PondModel.find({ name: req.query.pond_name });
    res.status(status.success).send(result);
  } catch (error) {
    res.status(status.error).json({
      status: status.error,
      message: error.message,
    });
  }
};
