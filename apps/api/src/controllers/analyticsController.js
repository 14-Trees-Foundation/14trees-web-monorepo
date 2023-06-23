const { status } = require("../helpers/status");
const TreeModel = require("../models/tree");
const TreeTypeModel = require("../models/treetype");
const UserModel = require("../models/user");
const PlotModel = require("../models/plot");
const { PondModel, pondUpdate } = require("../models/pond");
const UserTreeModel = require("../models/userprofile");

module.exports.summary = async (req, res) => {
    try {
        let treeCount = await TreeModel.estimatedDocumentCount({});
        let treeTypecount = await TreeTypeModel.estimatedDocumentCount({});
        let userCount = await UserModel.distinct('user_id').count()
        let assignedTreeCount = await UserTreeModel.estimatedDocumentCount({});
        let plotCount = await PlotModel.estimatedDocumentCount({});
        let pondCount = await PondModel.estimatedDocumentCount({});
        res.status(status.success).send({
            treeCount: treeCount,
            treeTypeCount: treeTypecount,
            userCount: userCount,
            assignedTreeCount: assignedTreeCount,
            plotCount: plotCount,
            pondCount: pondCount
        });
    } catch (error) {
        res.status(status.error).send({
            error: error
        });
    }
}

module.exports.getTotalTree = async (req, res) => {
    try {
        let count = await TreeModel.estimatedDocumentCount({});
        res.status(status.success).send({
            count: count
        });
    } catch (error) {
        res.status(status.error).send({
            error: error
        });
    }
}

module.exports.getTotalTreeType = async (req, res) => {
    try {
        let count = await TreeTypeModel.estimatedDocumentCount({});
        res.status(status.success).send({
            count: count
        });
    } catch (error) {
        res.status(status.error).send({
            error: error
        });
    }
}

module.exports.getUniqueUsers = async (req, res) => {
    try {
        let count = await UserModel.distinct('user_id').count()
        res.status(status.success).send({
            count: count
        });
    } catch (error) {
        res.status(status.error).send({
            error: error
        });
    }
}

module.exports.getTotalPlots = async (req, res) => {
    try {
        let count = await PlotModel.estimatedDocumentCount({});
        res.status(status.success).send({
            count: count
        });
    } catch (error) {
        res.status(status.error).send({
            error: error
        });
    }
}

module.exports.getTotalPonds = (req, res) => {
    res.status(status.success).send({
        count: 70
    });
}

module.exports.getTotalEmployees = (req, res) => {
    res.status(status.success).send({
        count: 100
    });
}