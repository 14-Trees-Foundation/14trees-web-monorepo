const { status } = require("../helpers/status");
const uploadHelper = require("./helper/uploadtos3");
const UserTreeModel = require("../models/userprofile");

module.exports.addMemories = async (req, res) => {
  if (!req.body.date) {
    res.status(status.bad).send({ error: "Date required" });
    return;
  }

  // Dates required for inserting memories
  let newdate = new Date(req.body.date);
  const offset = newdate.getTimezoneOffset();
  newdate = new Date(newdate.getTime() - offset * 60 * 1000);
  newdate = newdate.toISOString().split("T")[0];
  // End date should not be next date
  let enddate = newdate + "T23:59:59";

  // Memory images are required
  let memoryimages = req.body.memoryimages.split(",");
  if (memoryimages.length === 0) {
    res.status(status.bad).send({ error: "No memory image provided" });
    return;
  }

  // Add memory images to album named by given date
  for (const image in memoryimages) {
    await uploadHelper.UploadFileToS3(memoryimages[image], "albums", newdate);
  }

  // Memry image urls will be saved in each profile
  const s3urlmemories =
    "https://14treesplants.s3.ap-south-1.amazonaws.com/memories/" +
    newdate +
    "/";
  let mimageurl =
    memoryimages !== undefined
      ? memoryimages.map((x) => s3urlmemories + x)
      : "";

  try {
    let usertree = await UserTreeModel.updateMany(
      { date_added: { $gte: newdate, $lte: enddate }, plantation_type: 'onsite' },
      { $set: { memories: mimageurl } }
    );
    res.status(status.created).send()
  } catch (error) {
    res.status(status.error).json({
        error,
      });
  }
};
