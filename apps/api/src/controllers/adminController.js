const { errorMessage, successMessage, status } = require("../helpers/status");
const OnSiteStaffModel = require("../models/onsitestaff");
const csvhelper = require("./helper/uploadtocsv");

module.exports.addStaff = async (req, res) => {

    try {
        if (!req.body.name) {
            throw new Error("User name is required");
        }
        if (!req.body.phone) {
            throw new Error("Contact is required");
        }
    } catch (error) {
        res.status(status.bad).send({ error: error.message });
        return;
    }

    // Check if user type exists
    let userExists = await OnSiteStaffModel.findOne({ email: req.body.email });

    // If plot exists, return error
    if (userExists) {
        res.status(status.bad).send({ error: "User ID already exist" });
        return;
    }

    let user_id = req.body.name.split(" ")[0];

    // Tree type object to be saved
    let obj = {
        name: req.body.name,
        user_id: user_id,
        email: req.body.email ? req.body.email : null,
        role: req.body.role ? req.body.role : "",
        phone: req.body.phone ? req.body.phone : null,
        permissions: req.body.permissions ? req.body.permissions : null,
        date_added: new Date().toISOString(),
    };

    const staff = new OnSiteStaffModel(obj);

    let userRes;
    try {
        userRes = await staff.save();
    } catch (error) {
        res.status(status.error).json({ error });
        return;
    }

    // Save the info into the sheet
    try {
        csvhelper.updateStaffCsv(obj);
        res.status(status.created).json({
            user: userRes,
            csvupload: "Success"
        });
    } catch (error) {
        console.log(error)
        res.status(status.error).json({
            user: userRes,
            csvupload: "Failure"
        });
    }
}

module.exports.getTreeLoggingUsers = async (req, res) => {
    try {
        let result = await OnSiteStaffModel.find({ role: { $eq: 'treelogging' } });
        res.status(status.success).send(result);
    } catch (error) {
        res.status(status.error).json({
            status: status.error,
            message: error.message,
        });
    }
}