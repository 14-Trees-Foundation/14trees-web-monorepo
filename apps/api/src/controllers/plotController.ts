import { PlotRepository } from "../repo/plotRepo";
import { status } from "../helpers/status";
import { getOffsetAndLimitFromRequest } from "./helper/request";
import { Request, Response } from "express";
import { FilterItem } from "../models/pagination";
import { Op } from "sequelize";
import { constants } from "../constants";
import { getPlotNameAndCoordinatesFromKml } from "./helper/parsekml";
import { UploadFileToS3 } from "./helper/uploadtos3";
import { SiteRepository } from "../repo/sitesRepo";

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

export const addPlot = async (req: Request, res: Response) => {

    try {
        if (!req.body.plot_name) {
            if (!req.body.name) {
                throw new Error("Plot name is required");
            } else {
                req.body["plot_name"] = req.body.name;
            }
        }
    } catch (error: any) {
        res.status(status.bad).send({ error: error.message });
        return;
    }

    try {
        const plot = await PlotRepository.addPlot(req.body);
        res.status(status.created).json(plot);
    } catch (error: any) {
        res.status(status.error).json({ error: error.message });
    }
}

export const getPlots = async (req: Request, res: Response) => {
    const { offset, limit } = getOffsetAndLimitFromRequest(req);
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

export const deletePlot = async (req: Request, res: Response) => {
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

export const getPlotTags = async (req: Request, res: Response) => {
    const { offset, limit } = getOffsetAndLimitFromRequest(req);
    try {
        let data = await PlotRepository.getPlotTags(offset, limit);
        res.status(status.success).json(data);
    } catch (error: any) {
        res.status(status.error).send({ error: error.message });
    }
};

export const assignPlotsToSite = async (req: Request, res: Response) => {
    const { plot_ids, site_id } = req.body;
    try {
        const updateFields = { site_id: site_id };
        const whereClause = {
            id: { [Op.in]: plot_ids }
        };

        await PlotRepository.updatePlots(updateFields, whereClause);
        res.status(status.success).send();
    } catch (error: any) {
        console.log('[ERROR]', 'PlotsController::assignPlotsToSite', error)
        res.status(status.error).send({ error: 'Something went wrong. Please try again after some time.' });
    }
}

export const updateCoordinatesUsingKml = async (req: Request, res: Response) => {
    try {
        const { site_id } = req.body
        if (!site_id) {
            throw new Error('Site id is required');
        }
        if (!req.file) {
            throw new Error('No file uploaded. this operation requires kml file');
        }

        // upload kml file
        const file = req.file
        if(file){
            const url = await UploadFileToS3(file.filename, "sites");
            if (url) {
                await SiteRepository.updateSites({ kml_file_link: url, updated_at: new Date() }, { id: site_id });
            }
        }

        const filePath = constants.DEST_FOLDER + req.file.filename
        const coordinatesMap = await getPlotNameAndCoordinatesFromKml(filePath);

        for (const [plotLabel, {coordinates, acresArea}] of coordinatesMap) {
            const whereClause = { label: plotLabel, site_id: site_id};
            const location = {
                type: 'Polygon',
                coordinates: [coordinates.map(coord => [coord.latitude, coord.longitude])]
            }
            const updateFields = {
                boundaries: location,
                acres_area: acresArea,
                updated_at: new Date(),
            }
            await PlotRepository.updatePlots(updateFields, whereClause);
        }

        res.status(status.success).send();
    } catch (error: any) {
        console.log('[ERROR]', 'PlotsController::updateCoordinatesUsingKml', error)
        res.status(status.error).send({ error: 'Something went wrong. Please try again after some time.' });
    }
}

export const treesCountForCategory = async (req: Request, res: Response) => {

    try {
        let result = await PlotRepository.treesCountForCategory();
        res.status(status.success).send(result);
    } catch (error: any) {
        console.log("[ERROR]", "PlotsController::treesCountForCategory", error);
        res.status(status.error).json({
            status: status.error,
            message: "Something went wrong. Please try again after some time.",
        });
    }
}