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
import { TagRepository } from "../repo/tagRepo";
import { SortOrder } from "../models/common";

/*
    Model - Plot
    CRUD Operations for plots collection
*/

export const updatePlot = async (req: Request, res: Response) => {
    try {
        let result = await PlotRepository.updatePlot(req.body)

        const tags = req.body.tags;
        if (tags && tags.length > 0) {
            await TagRepository.createTags(tags.map((tag: string) => ({ tag, type: 'USER_DEFINED' })))
        }
        
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

        const tags = req.body.tags;
        if (tags && tags.length > 0) {
            await TagRepository.createTags(tags.map((tag: string) => ({ tag, type: 'USER_DEFINED' })))
        }
        res.status(status.created).json(plot);
    } catch (error: any) {
        res.status(status.error).json({ error: error.message });
    }
}

export const getPlots = async (req: Request, res: Response) => {
    const { offset, limit } = getOffsetAndLimitFromRequest(req);
    const filters: FilterItem[] = req.body?.filters;
    const orderBy: { column: string, order: "ASC" | "DESC" }[] = req.body?.order_by;

    try {
        let result = await PlotRepository.getPlots(offset, limit, filters, orderBy);

        result.results = result.results.map((item: any) => {
            return {
                ...item,
                total: parseInt(item.total),
                booked: parseInt(item.booked),
                assigned: parseInt(item.assigned),
                available: parseInt(item.available),
                card_available: parseInt(item.card_available),
                unbooked_assigned: parseInt(item.unbooked_assigned),
                void_available: parseInt(item.void_available),
                void_assigned: parseInt(item.void_assigned),
                void_booked: parseInt(item.void_booked),
                void_total: parseInt(item.void_total),
                tree_count: parseInt(item.tree_count),
                shrub_count: parseInt(item.shrub_count),
                herb_count: parseInt(item.herb_count),
                booked_trees: parseInt(item.booked_trees),
                assigned_trees: parseInt(item.assigned_trees),
                unbooked_assigned_trees: parseInt(item.unbooked_assigned_trees),
                available_trees: parseInt(item.available_trees),
                card_available_trees: parseInt(item.card_available_trees),
                booked_shrubs: parseInt(item.booked_shrubs),
                assigned_shrubs: parseInt(item.assigned_shrubs),
                unbooked_assigned_shrubs: parseInt(item.unbooked_assigned_shrubs),
                available_shrubs: parseInt(item.available_shrubs),
                card_available_shrubs: parseInt(item.card_available_shrubs),
                booked_herbs: parseInt(item.booked_herbs),
                assigned_herbs: parseInt(item.assigned_herbs),
                unbooked_assigned_herbs: parseInt(item.unbooked_assigned_herbs),
                available_herbs: parseInt(item.available_herbs),
                card_available_herbs: parseInt(item.card_available_herbs),
                distinct_plants: item.distinct_plants ? item.distinct_plants.filter((item: any) => item !== null) : [],
            }
        })
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

export const getPlotAggregations = async (req: Request, res: Response) => {
    const { offset, limit } = getOffsetAndLimitFromRequest(req);
    const filters: FilterItem[] = req.body?.filters;
    const orderBy: { column: string, order: "ASC" | "DESC" }[] = req.body?.order_by;

    try {
        let result = await PlotRepository.getPlotAggregations(offset, limit, filters, orderBy);
        result.results = result.results.map((item: any) => {
            return {
                ...item,
                total: parseInt(item.total),
                booked: parseInt(item.booked),
                assigned: parseInt(item.assigned),
                available: parseInt(item.available),
                unbooked_assigned: parseInt(item.unbooked_assigned),
            }
        })
        res.status(status.success).send(result);
    } catch (error: any) {
        console.log("[ERROR]", "PlotsController::getPlotAggregations", error);
        res.status(status.error).json({
            status: status.error,
            message: "Something went wrong. Please try again after some time.",
        });
    }
}

export const getPlotStatesForCorporate = async (req: Request, res: Response) => {
    const { offset, limit } = getOffsetAndLimitFromRequest(req);
    const filters: FilterItem[] = req.body?.filters;
    const orderBy: SortOrder[] = req.body?.order_by;
    const groupId: number = req.body?.group_id;

    try {
        let result = await PlotRepository.getPlotStatesForCorporate(offset, limit, groupId, filters, orderBy);
        result.results = result.results.map((item: any) => {
            return {
                ...item,
                total: parseInt(item.total),
                booked: parseInt(item.booked),
                available: parseInt(item.available),
                card_available: parseInt(item.card_available),
            }
        })
        res.status(status.success).send(result);
    } catch (error: any) {
        console.log("[ERROR]", "PlotsController::getPlotStatesForCorporate", error);
        res.status(status.error).json({
            status: status.error,
            message: "Something went wrong. Please try again after some time.",
        });
    }
}

export const getCSRTreesAnalysis = async (req: Request, res: Response) => {
    const groupId: string = req.query.group_id as string;
    let grId: number | undefined = undefined;
    if (!isNaN(parseInt(groupId))) grId = parseInt(groupId);

    try {
        let result = await PlotRepository.getCSRTreesAnalysis(grId);
        res.status(status.success).send(result);
    } catch (error: any) {
        console.log("[ERROR]", "PlotsController::getCSRTreesAnalysis", error);
        res.status(status.error).json({
            status: status.error,
            message: "Something went wrong. Please try again after some time.",
        });
    }
}