import { status } from "../helpers/status";
import { FilterItem } from "../models/pagination";
import { SiteRepository } from "../repo/sitesRepo";
import { syncNotionSites } from "../services/notion/sites";
import { getWhereOptions } from "./helper/filters";
import { getOffsetAndLimitFromRequest } from "./helper/request";
import { Request, Response } from "express";
import { UploadFileToS3 } from "./helper/uploadtos3";
import { SortOrder } from "../models/common";

  

/*
    Model - Site
    CRUD Operations for sites collection
*/

export const getSites = async (req: Request, res: Response) => {
    const {offset, limit } = getOffsetAndLimitFromRequest(req);
    const filters: FilterItem[] = req.body?.filters;
    let whereClause = {};
    
    if (filters && filters.length > 0) {
        filters.forEach(filter => {
            whereClause = { ...whereClause, ...getWhereOptions(filter.columnField, filter.operatorValue, filter.value) }
        })
    }

    try {
        let result = await SiteRepository.getSites(offset, limit, whereClause);
        res.status(status.success).send(result);
    } catch (error: any) {
        res.status(status.error).json({
            status: status.error,
            message: error.message,
        });
    }
}

export const addSite = async (req: Request, res: Response) => {
    const reqData = req.body
  
    if(reqData.maintenance_type){
        reqData.maintenance_type = reqData.maintenance_type.toUpperCase();
    }

    // upload kml file
    const file = req.file
    if(file){
        const url = await UploadFileToS3(file.filename, "sites");
        console.log("Uploaded URL ..." , url);
        req.body["kml_file_link"] = url;
    }

    try {
        let result = await SiteRepository.addSite(reqData);
        res.status(status.success).send(result);
    } catch (error: any) {
        res.status(status.error).json({
            status: status.error,
            message: error.message,
        });
    }
}

export const updateSite = async (req: Request, res: Response) => {
    
    if(req.body.maintenance_type){
        req.body.maintenance_type =  req.body.maintenance_type.toUpperCase();
    }

    req.body.tags = req.body.tags?JSON.parse(req.body.tags):[];

    // upload kml file
    const file = req.file
    if(file){
        const url = await UploadFileToS3(file.filename, "sites");
        console.log("Uploaded URL ..." , url);
        req.body["kml_file_link"] = url;
    }

    try {
        let result = await SiteRepository.updateSite(req.body);
        res.status(status.created).json(result);
    } catch (error) {
        console.log(error)
        res.status(status.error).json({ error: error });
    }
}


export const deleteSite = async (req: Request, res: Response) => {
    try {
        let resp = await SiteRepository.deleteSite(req.params.id);
        console.log("Delete site Response for id: %s", req.params.id, resp);
        res.status(status.success).json({
          message: "Site deleted successfully",
        });
    } catch (error: any) {
        res.status(status.bad).send({ error: error.message });
    }
}

export const syncSitesDatFromNotion = async (req: Request, res: Response) => {
    try {
        await syncNotionSites();
        await SiteRepository.updateSitesDataUsingNotionData();
        await SiteRepository.insertNewSitesDataUsingNotionData();

        res.status(status.success).json();
    } catch (error: any) {
        console.log('[ERROR]', 'SitesController::syncSitesDatFromNotion', error);
        res.status(status.bad).send({ error: 'Something went wrong!' });
    }
}

const parseCountToInt = (data: any[]) => {
    return data.map(item => {
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
        }
    })
}

export const getTreeCountsForSites = async (req: Request, res: Response) => {
    const { offset, limit } = getOffsetAndLimitFromRequest(req);
    const filters: FilterItem[] = req.body?.filters;
    const order_by: { column: string, order: "ASC" | "DESC" }[] = req.body?.order_by;

    try {
        let result = await SiteRepository.treeCountForSites(offset, limit, filters, order_by);
        result.results = parseCountToInt(result.results);
        res.status(status.success).send(result);
    } catch (error: any) {
        res.status(status.error).json({
            status: status.error,
            message: error.message,
        });
    }
}

export const getTreesCountForField = async (req: Request, res: Response) => {
    const { field } = req.params;
    const { offset, limit } = getOffsetAndLimitFromRequest(req);
    const filters: FilterItem[] = req.body?.filters;
    const order_by: { column: string, order: "ASC" | "DESC" }[] = req.body?.order_by;
    try {
        let result = await SiteRepository.treeCountForFields(field, offset, limit, filters, order_by);
        result.results = parseCountToInt(result.results);
        res.status(status.success).send(result);
    } catch (error: any) {
        console.log("[ERROR]", "SitesController::getTreesCountForField", error);
        res.status(status.error).json({
            status: status.error,
            message: "Something went wrong. Please try again after some time.",
        });
    }
}

export const getDistrictsData = async (req: Request, res: Response) => {
    
    try {
        let result = await SiteRepository.getDistrictsData();
        res.status(status.success).send(result);
    } catch (error: any) {
        console.log("[ERROR]", "SitesController::getDistrictsData", error);
        res.status(status.error).json({
            status: status.error,
            message: "Something went wrong. Please try again after some time.",
        });
    }
}

export const getTreeCountsForTags = async (req: Request, res: Response) => {
    const { offset, limit } = getOffsetAndLimitFromRequest(req);
    const filters: FilterItem[] = req.body?.filters;
    const order_by: { column: string, order: "ASC" | "DESC" }[] = req.body?.order_by;

    try {
        let result = await SiteRepository.getTreeCountsForTags(offset, limit, filters, order_by);
        result.results = parseCountToInt(result.results);
        res.status(status.success).send(result);
    } catch (error: any) {
        console.log("[ERROR]", "SitesController::getTreesCountForTags", error);
        res.status(status.error).json({
            status: status.error,
            message: "Something went wrong. Please try again after some time.",
        });
    }
}

export const getCorporateTreeDistribution = async (req: Request, res: Response) => {
    const { groupId } = req.params;

    try {
        let result = await SiteRepository.getTreeCountForCorporate(parseInt(groupId));
        result = result.map((item: any) => {
            return {
                ...item,
                booked: parseInt(item.booked),
                available: parseInt(item.available),
                total: parseInt(item.total),
                assigned: parseInt(item.assigned)
            }
        })
        res.status(status.success).send(result);
    } catch (error: any) {
        console.log("[ERROR]", "SitesController::getCorporateTreeDistribution", error);
        res.status(status.error).json({
            status: status.error,
            message: "Something went wrong. Please try again after some time.",
        });
    }
}

export const getSiteStatesForCorporate = async (req: Request, res: Response) => {
    const { offset, limit } = getOffsetAndLimitFromRequest(req);
    const filters: FilterItem[] = req.body?.filters;
    const orderBy: SortOrder[] = req.body?.order_by;
    const groupId: number = req.body?.group_id;

    try {
        let result = await SiteRepository.getSiteStatesForCorporate(offset, limit, groupId, filters, orderBy);
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
        console.log("[ERROR]", "SitesController::getSiteStatesForCorporate", error);
        res.status(status.error).json({
            status: status.error,
            message: "Something went wrong. Please try again after some time.",
        });
    }
}