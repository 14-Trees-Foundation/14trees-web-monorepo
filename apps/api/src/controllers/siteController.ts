import { status } from "../helpers/status";
import { Site } from "../models/sites";
import { SiteRepository } from "../repo/sitesRepo";
import { getOffsetAndLimitFromRequest } from "./helper/request";
import { Request, Response } from "express";
  

/*
    Model - Site
    CRUD Operations for sites collection
*/

export const getSites = async (req: Request, res: Response) => {
    const {offset, limit } = getOffsetAndLimitFromRequest(req);
    try {
        let result = await SiteRepository.getSites(offset, limit);
        res.status(status.success).send(result);
    } catch (error: any) {
        res.status(status.error).json({
            status: status.error,
            message: error.message,
        });
    }
}

export const updateSite = async (req: Request, res: Response) => {
    try {
        let result = await SiteRepository.updateSite(req.body)
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