const { errorMessage, successMessage, status } = require("../helpers/status");
const OrgModel = require("../models/org");
const csvhelper = require("./helper/uploadtocsv");

module.exports.addOrg = async (req, res) => {

    if (!req.body.name) {
        res.status(status.bad).send({ error: "Organization name is required" });
        return;
    }

    let obj = {
        name: req.body.name,
        date_added: new Date().toISOString(),
        desc: req.body.desc ? req.body.desc : "",
        type: req.body.type ? req.body.type : "",
    }
    let org = new OrgModel(obj)

    let orgRes;
    try {
        orgRes = await org.save();
    } catch (error) {
        res.status(status.bad).json({
            error: error,
        });
    }

    // Save the info into the sheet
    try {
        csvhelper.UpdateOrg(obj);
        res.status(status.created).json({
            org: orgRes,
            csvupload: "Success"
        });
    } catch (error) {
        res.status(status.error).json({
            org: orgRes,
            csvupload: "Failure"
        });
    }
}


module.exports.getOrg = async (req, res) => {

    try {
        let result = await OrgModel.find();
        res.status(status.success).send(result);
    } catch (error) {
        res.status(status.error).json({
            status: status.error,
            message: error.message,
        });
    }
}