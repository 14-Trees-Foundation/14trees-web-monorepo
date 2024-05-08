const PlotModel = require("../models/plot");
const { errorMessage, successMessage, status } = require("../helpers/status");
const csvhelper = require("./helper/uploadtocsv");
const { getOffsetAndLimitFromRequest } = require("./helper/request");

/*
    Model - Plot
    CRUD Operations for plots collection
*/

module.exports.updatePlot = async (req, res) => {
    // Check if plot type exists
    // let plotExists = await PlotModel.findOne({ plot_id: req.body.shortname });
    // // If plot exists, return error
    // if (!plotExists) {
    //     res.status(status.bad).send({ error: "Plot doesn't exist" });
    //     return;
    // }
    // console.log(plotExists)
    try {
        let result = await PlotModel.findOneAndUpdate(
            {
                query: { plot_id: req.body.shortname },
                update: { "$set": { "boundaries.coordinates.0": req.body.boundaries } },
                upsert: false
            }
        )
        res.status(status.created).json({
            plot: result,
        });
    } catch (error) {
        console.log(error)
        res.status(status.error).json({ error: error });
    }
}

module.exports.addPlot = async (req, res) => {

    try {
        if (!req.body.plot_name) {
            throw new Error("Plot name is required");
        }
        if (!req.body.plot_code) {
            throw new Error("Short plot code is required");
        }
        if (!req.body.boundaries) {
            throw new Error("Boundaries Lat Lng required");
        }
    } catch (error) {
        res.status(status.bad).send({ error: error.message });
        return;
    }

    // Check if plot type exists
    let plotExists = await PlotModel.findOne({ plot_id: req.body.plot_code });

    // If plot exists, return error
    if (plotExists) {
        res.status(status.bad).send({ error: "Plot already exist" });
        return;
    }

    // Tree type object to be saved
    let obj = {
        name: req.body.plot_name,
        plot_id: req.body.plot_code,
        boundaries: req.body.boundaries,
        center: req.body.center,
        date_added: new Date().toISOString()
    };
    const plot = new PlotModel(obj);

    let plotres;
    try {
        plotres = await plot.save();
        res.status(status.created).json({
            plot: plotres,
        });
    } catch (error) {
        res.status(status.error).json({ error });
    }

    // Use this too save info in sheet
    // Save the info into the sheet
    // try {
    //     csvhelper.UpdatePlotCsv(obj);
    //     res.status(status.created).json({
    //         plot: plotres,
    //         csvupload: "Success"
    //     });
    // } catch (error) {
    //     res.status(status.error).json({
    //         treetype: treeTypeRes,
    //         csvupload: "Failure"
    //     });
    // }
}

module.exports.getPlots = async (req, res) => {
    const {offset, limit } = getOffsetAndLimitFromRequest(req);
    try {
        let result = await PlotModel.find().skip(offset).limit(limit);;
        res.status(status.success).send(result);
    } catch (error) {
        res.status(status.error).json({
            status: status.error,
            message: error.message,
        });
    }
}

module.exports.deletePlot = async (req, res) => {
    try {
        let resp = await PlotModel.findByIdAndDelete(req.params.id).exec();
        console.log("Delete Plot Response for id: %s", req.params.id, resp)
        res.status(status.success).json({
          message: "Plot deleted successfully",
        });
    } catch (error) {
        res.status(status.bad).send({ error: error.message });
    }
};