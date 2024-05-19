
// const csvhelper = require("./helper/uploadtocsv");

import PlotModel from "../models/plot";
import { errorMessage, successMessage, status } from "../helpers/status";
import { UpdatePlotCsv } from "./helper/uploadtocsv"; // Assuming UpdatePlotCsv function exists
import { getOffsetAndLimitFromRequest } from "./helper/request";
import { Request, Response } from "express";

/*
    Model - Plot
    CRUD Operations for plots collection
*/

export const updatePlot = async (req: Request,res: Response) => {
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

export const addPlot = async (req: Request,res: Response) => {

    try {
        if (!req.body.plot_name) {
            if (!req.body.name) {
                throw new Error("Plot name is required");
            } else {
                req.body["plot_name"] = req.body.name;
            }
        }
        if (!req.body.plot_code) {
            if (!req.body.plot_id) {
                throw new Error("Short plot code is required");
            } else {
                req.body["plot_code"] = req.body.plot_id;
            }
        }
        if (!req.body.boundaries) {
            throw new Error("Boundaries Lat Lng required");
        }
    } catch (error: any) {
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

export const getPlots = async (req: Request,res: Response) => {
    const {offset, limit } = getOffsetAndLimitFromRequest(req);
    let filters: Record<string,any> = {}
    if (req.query?.name) {
        filters["name"] = new RegExp(req.query?.name as string, "i")
    }
    try {
        let result = await PlotModel.find(filters).skip(offset).limit(limit);;
        res.status(status.success).send(result);
    } catch (error: any) {
        res.status(status.error).json({
            status: status.error,
            message: error.message,
        });
    }
}

export const deletePlot = async (req: Request,res: Response) => {
    try {
        let resp = await PlotModel.findByIdAndDelete(req.params.id).exec();
        console.log("Delete Plot Response for id: %s", req.params.id, resp)
        res.status(status.success).json({
          message: "Plot deleted successfully",
        });
    } catch (error: any) {
        res.status(status.bad).send({ error: error.message });
    }
};