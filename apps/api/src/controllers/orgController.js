const { errorMessage, successMessage, status } = require("../helpers/status");
const OrgModel = require("../models/org");
const csvhelper = require("./helper/uploadtocsv");
const { getOffsetAndLimitFromRequest } = require("./helper/request");
const { getQueryExpression } = require("./helper/filters");

/*
    Model - Org
    CRUD Operations for organizations collection
*/

module.exports.getOrgs = async (req, res) => {
    const {offset, limit } = getOffsetAndLimitFromRequest(req);
    let filters = {}
    if (req.body.filters) {
        req.body.filters.array.forEach(element => {
            const filter = getQueryExpression(element.columnField, element.operatorValue, element.value)
            filters = {...filters, ...filter};  
        });
    }
    try {
        let result = await OrgModel.find(filters).skip(offset).limit(limit);
        res.status(status.success).send(result);
    } catch (error) {
        res.status(status.error).json({
            status: status.error,
            message: error.message,
        });
    }
}

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


module.exports.updateOrg = async (req, res) => {

    try {
        let org = await OrgModel.findById(req.params.id);
        if (!org) {
            throw new Error("Organization not found for given id");
        }

        if (req.body.name) {
            org.name = req.body.name;
        }
        if (req.body.desc) {
            org.name = req.body.desc;
        }
        if (req.body.type) {
            org.name = req.body.type;
        }

        const updatedOrg = await org.save();
        res.status(status.success).send(updatedOrg);

    } catch (error) {
        res.status(status.bad).send({ error: error.message });
    }
}


module.exports.deleteOrg = async (req, res) => {

    try {
        let response = await OrgModel.findByIdAndDelete(req.params.id).exec();
        console.log("Delete Org Response for orgId: %s", req.params.id, response)

        res.status(status.success).send({
            message: "Organization deleted successfully",
          })
    } catch (error) {
        res.status(status.bad).send({ error: error.message });
    }
}

module.exports.searchOrgs = async (req, res) => {
    try {
      if (!req.params.search || req.params.search.length < 3) {
        res.status(status.bad).send({ error: "Please provide at least 3 char to search"});
        return;
      }
  
      const { offset, limit } = getOffsetAndLimitFromRequest(req);
      const regex = new RegExp(req.params.search, 'i');
      const orgs = await OrgModel.find({name: { $regex: regex }}).skip(offset).limit(limit);
      res.status(status.success).send(orgs);
      return;
    } catch (error) {
      res.status(status.bad).send({ error: error.message });
      return;
    }
};
  