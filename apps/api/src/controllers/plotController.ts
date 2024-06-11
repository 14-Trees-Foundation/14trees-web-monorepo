
// const csvhelper = require("./helper/uploadtocsv");

import PlotModel from "../models/plot";
import { errorMessage, successMessage, status } from "../helpers/status";
import { UpdatePlotCsv } from "./helper/uploadtocsv"; // Assuming UpdatePlotCsv function exists
import { getOffsetAndLimitFromRequest } from "./helper/request";
import { Request, Response } from "express";
import { getQueryExpression } from "./helper/filters";

/*
    Model - Plot
    CRUD Operations for plots collection
*/

export const updatePlotCoordinates = async (req: Request,res: Response) => {
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

export const updatePlot = async (req: Request,res: Response) => {
    try {
        let plot = await PlotModel.findById(req.params.id);
        if (plot) {
            const resp = await plot.updateOne(req.body);
        }
        res.status(status.success).json({
            plot: req.body,
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
        let result = await getPlotsWithTreesCount(offset, limit, filters);
        let resultCount = await PlotModel.find(filters).count();
        res.status(status.success).send({
            result: result,
            total: resultCount
        });
    } catch (error: any) {
        res.status(status.error).json({
            status: status.error,
            message: error.message,
        });
    }
}

export const getPlotsByFilters = async (req: Request,res: Response) => {
    const {offset, limit } = getOffsetAndLimitFromRequest(req);
    let filterReq = req.body.filters;
    let filters = {};
    if (filterReq && filterReq.length != 0) {
      filterReq.forEach((filter: any) => {
        filters = { ...filters, ...getQueryExpression(filter.columnField, filter.operatorValue, filter.value)}
      });
    }
    try {
        let result = await getPlotsWithTreesCount(offset, limit, filters);
        let resultCount = await PlotModel.find(filters).count();
        res.status(status.success).send({
            result: result,
            total: resultCount
        });
    } catch (error: any) {
        res.status(status.error).json({
            status: status.error,
            message: error.message,
        });
    }
}

const getPlotsWithTreesCount = async (offset: number, limit: number, filters: any) => {
    return await PlotModel.aggregate([
        { $match: filters },
        {
            $lookup: {
                from: "trees",
                localField: "_id",
                foreignField: "plot_id",
                pipeline: [
                    {
                        $lookup: {
                            from: "user_tree_regs",
                            localField: "_id",
                            foreignField: "tree",
                            as: "assigned"
                        }
                    }
                ],
                as: "trees"
            }
        },
        {
            $addFields: {
                trees_count: { $size: "$trees" },
                mapped_trees_count: {
                    $size: {
                        $filter: {
                            input: "$trees",
                            as: "tree",
                            cond: { $ifNull: ["$$tree.mapped_to", null] }
                        }
                    }
                },
                assigned_trees_count: { 
                    $size: {
                        $filter: {
                            input: "$trees",
                            as: "tree", 
                            cond: { $gt: [ { $size: "$$tree.assigned" } , 0] }
                        }
                    }
                },
                available_trees_count: { 
                    $size: {
                        $filter: {
                            input: "$trees",
                            as: "tree",
                            cond: { $and: [ { $eq: [ { $size: "$$tree.assigned" } , 0] }, { $eq: [ { $ifNull: ["$$tree.mapped_to", null] }, null]} ] }
                        }
                    }
                }
            }
        },
        {
            $project: {
                trees: 0,
            }
        },
        { $skip: offset },
        { $limit: limit },
    ])
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

export const searchPlots = async (req: Request, res: Response) => {
    try {
      if (!req.params.search || req.params.search.length < 3) {
        res.status(status.bad).send({ error: "Please provide at least 3 char to search"});
        return;
      }
  
      const { offset, limit } = getOffsetAndLimitFromRequest(req);
      const regex = new RegExp(req.params.search, 'i');
      const plots = await PlotModel.find({name: { $regex: regex }}).skip(offset).limit(limit);
      res.status(status.success).send(plots);
      return;
    } catch (error: any) {
      res.status(status.bad).send({ error: error.message });
      return;
    }
};