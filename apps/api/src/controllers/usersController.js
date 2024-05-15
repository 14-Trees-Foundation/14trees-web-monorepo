const { constants } = require("../constants");
const { errorMessage, successMessage, status } = require("../helpers/status");
const UserModel = require("../models/user");
const UserTreeModel = require("../models/userprofile");
const userHelper = require("./helper/users");
const csvParser = require('csv-parser');
const createCsvWriter = require('csv-writer').createObjectCsvWriter;
const fs = require('fs');
const { getOffsetAndLimitFromRequest } = require("./helper/request");

/*
    Model - User
    CRUD Operations for users collection
*/

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
    let user = userHelper.getUserDocumentFromRequestBody(req.body);
    let result = await user.save();
    res.status(status.created).json(result);
  } catch (error) {
    res.status(status.duplicate).json({
      status: status.duplicate,
      message: error.message,
    });
  }
};

module.exports.addUsersBulk = async (req, res) => {

  try {
    if (!req.file) {
      throw new Error('No file uploaded. Bulk operation requires data as csv file.');
    }

    let csvData = [];
    let failedRows = [];
    fs.createReadStream(constants.DEST_FOLDER + req.file.filename)
      .pipe(csvParser())
      .on('data', (row) => {
        csvData.push(row);
      })
      .on('end', async () => {
        try {
          if (csvData.length > constants.MAX_BULK_ADD_LIMIT) {
            throw new Error("Number of rows in csv file are more than allowed limit.")
          }

          let users = [];
          let batchRows = [];
          for (const row of csvData) {
            batchRows.push(row);
            let user = userHelper.getUserDocumentFromRequestBody(row);
            users.push(user);
            if (users.length === constants.ADD_DB_BATCH_SIZE) {
              try {
                await UserModel.bulkSave(users);
              } catch (error) {
                failedRows.push(...batchRows.map(row => ({ ...row, success: false, error: error.message })));
              }
              batchRows = [];
              users = [];
            }
          }

          if (users.length !== 0) {
            try {
              await UserModel.bulkSave(users);
            } catch (error) {
              failedRows.push(...batchRows.map(row => ({ ...row, success: false, error: error.message })));
            }
          }

          // Prepare the response
          let responseCsv = ''
          const filePath = constants.DEST_FOLDER + Date.now().toString() + '_' + 'failed_user_records.csv'
          if (failedRows.length > 0) {
            // Generate CSV string for failed rows
            const csvWriter = createCsvWriter({
              path: filePath,
              header: Object.keys(failedRows[0]).map(key => ({ id: key, title: key }))
            });
            await csvWriter.writeRecords(failedRows);
            responseCsv = fs.readFileSync(filePath);
          }

          // Send the response with CSV content
          res.setHeader('Content-Disposition', 'attachment; filename="failed_rows.csv"');
          res.setHeader('Content-Type', 'text/csv');
          res.send(responseCsv);
        } catch (error) {
          console.error('Error saving User bulk data:', error);
          res.status(500).json({ error: 'Error saving users data.' });
        }
      });

  } catch (error) {
    console.error('Error processing CSV:', error);
    res.status(500).json({ error: error.message });
  }
};

module.exports.getUser = async (req, res) => {
  try {
    if (req.query.email && req.query.name) {
      let userid = req.query.name.toLowerCase() + req.query.email.toLowerCase();
      userid = userid.replace(/[^A-Z0-9@.]+/gi, "");

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
    } else {
      const { offset, limit } = getOffsetAndLimitFromRequest(req);
      let result = await UserModel.find().skip(offset).limit(limit);
      res.status(status.success).json(result);
    }

  } catch (error) {
    res.status(status.bad).send({ error: error.message });
    return;
  }
};

module.exports.getUsersByEmailIdPrefix = async (req, res) => {
  try {
    if (!req.params.email || req.params.email.length < 3) {
      res.status(status.bad).send({ error: "Please provide at least 3 char of email"});
      return;
    }

    const { offset, limit } = getOffsetAndLimitFromRequest(req);
    const regex = new RegExp(req.params.email, 'i');
    const users = await UserModel.find({ email: { $regex: regex } }).skip(offset).limit(limit);
    res.status(status.success).send(users);
    return;
  } catch (error) {
    res.status(status.bad).send({ error: error.message });
    return;
  }
};

module.exports.getUsers = async (req, res) => {
  const { offset, limit } = getOffsetAndLimitFromRequest(req);
  try {
    let result = await UserModel.find().skip(offset).limit(limit);
    res.status(status.success).json(result);
  } catch (error) {
    res.status(status.error).json({
      status: status.error,
      message: error.message,
    });
  }
};

module.exports.updateUser = async (req, res) => {

  try {
    let user = await UserModel.findById(req.params.id);
    if (!user) {
      res.status(status.notfound).json({
        status: status.notfound,
        message: "User not found with given id"
      })
    }

    if (req.body.name) user.name = req.body.name;
    if (req.body.email) user.email = req.body.email;
    if (req.body.dob) user.dob = req.body.dob;
    if (req.body.phone) user.phone = req.body.phone;
    if (req.body.org) user.org = req.body.org;

    user.userid = userHelper.getUserId(user.name, user.email);

    let result = await user.save();
    res.status(status.success).json(result);
  } catch (error) {
    res.status(status.error).json({
      status: status.error,
      message: error.message,
    });
  }
};


module.exports.deleteUser = async (req, res) => {

  try {
    let resp = await UserModel.findByIdAndDelete(req.params.id).exec();
    console.log("Deleted User with id: %s", req.params.id, resp)
    res.status(status.success).json(resp);
  } catch (error) {
    res.status(status.error).json({
      status: status.error,
      message: error.message,
    });
  }
};