import { status } from "../helpers/status";
import { FilterItem } from "../models/pagination";
import { Site } from "../models/sites";
import { SiteRepository } from "../repo/sitesRepo";
import { getWhereOptions } from "./helper/filters";
import { getOffsetAndLimitFromRequest } from "./helper/request";
import { Request, Response } from "express";
import { isArray } from "lodash";

  

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

    try {
        let result = await SiteRepository.updateSite(req.body ,isArray(req.files) ? req.files : []);
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