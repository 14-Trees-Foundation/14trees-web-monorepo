import { status } from "../helpers/status";
import { FilterItem } from "../models/pagination";
import { SiteRepository } from "../repo/sitesRepo";
import { syncDataFromNotionToDb } from "../services/notion";
import { getWhereOptions } from "./helper/filters";
import { getOffsetAndLimitFromRequest } from "./helper/request";
import { Request, Response } from "express";
import { UploadFileToS3 } from "./helper/uploadtos3";

  

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
        await syncDataFromNotionToDb();
        await SiteRepository.updateSitesDataUsingNotionData();
        await SiteRepository.insertNewSitesDataUsingNotionData();

        res.status(status.success).json();
    } catch (error: any) {
        console.log('[ERROR]', 'SitesController::syncSitesDatFromNotion', error);
        res.status(status.bad).send({ error: 'Something went wrong!' });
    }
}

export const getTreeCountsForSites = async (req: Request, res: Response) => {
    const {offset, limit } = getOffsetAndLimitFromRequest(req);
    const filters: FilterItem[] = req.body?.filters;

    try {
        let result = await SiteRepository.treeCountForSites(offset, limit, filters);
        res.status(status.success).send(result);
    } catch (error: any) {
        res.status(status.error).json({
            status: status.error,
            message: error.message,
        });
    }
}