import { PlotRepository } from "../repo/plotRepo";
import { status } from "../helpers/status";
import { getOffsetAndLimitFromRequest } from "./helper/request";
import { Request, Response } from "express";
import { FilterItem } from "../models/pagination";

/*
    Model - Plot
    CRUD Operations for plots collection
*/

export const updatePlot = async (req: Request, res: Response) => {
    try {
        let result = await PlotRepository.updatePlot(req.body)
        res.status(status.created).json(result);
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
        if (!req.body.plot_id) {
            if (!req.body.plot_code) {
                throw new Error("Short plot code is required");
            } else {
                req.body["plot_id"] = req.body.plot_code;
            }
        }
        if (!req.body.boundaries) {
            throw new Error("Boundaries Lat Lng required");
        }
    } catch (error: any) {
        res.status(status.bad).send({ error: error.message });
        return;
    }

    try {
        const plot = await PlotRepository.addPlot(req.body);
        res.status(status.created).json(plot);
    } catch (error) {
        res.status(status.error).json({ error });
    }
}

export const getPlots = async (req: Request,res: Response) => {
    const {offset, limit } = getOffsetAndLimitFromRequest(req);
    const filters: FilterItem[] = req.body?.filters;
    try {
        let result = await PlotRepository.getPlots(offset, limit, filters);
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
        let resp = await PlotRepository.deletePlot(req.params.id);
        console.log("Delete Plots Response for id: %s", req.params.id, resp);
        res.status(status.success).json({
          message: "Plot deleted successfully",
        });
    } catch (error: any) {
        res.status(status.bad).send({ error: error.message });
    }
};
