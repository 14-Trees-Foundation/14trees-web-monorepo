import { status } from "../helpers/status";
import { Org } from "../models/org";
import { OrgRepository } from "../repo/orgRepo";
import { getOffsetAndLimitFromRequest } from "./helper/request";
import { Request, Response } from "express";
  

/*
    Model - Org
    CRUD Operations for organizations collection
*/

export const getOrgs = async (req: Request, res: Response) => {
    const {offset, limit } = getOffsetAndLimitFromRequest(req);
    try {
        let result = await OrgRepository.getOrgs(req.query, offset, limit);
        res.status(status.success).send(result);
    } catch (error: any) {
        res.status(status.error).json({
            status: status.error,
            message: error.message,
        });
    }
}

export const addOrg = async (req: Request, res: Response) => {

    if (!req.body.name) {
        res.status(status.bad).send({ error: "Organization name is required" });
        return;
    }
    try {
        const org = await OrgRepository.addOrg(req.body);
        res.status(status.created).send(org);
    } catch (error) {
        res.status(status.bad).json({
            error: error,
        });
    }
}


export const updateOrg = async (req: Request, res: Response) => {
    try {
        let result = await OrgRepository.updateOrg(req.body)
        res.status(status.created).json(result);
    } catch (error) {
        console.log(error)
        res.status(status.error).json({ error: error });
    }
}


export const deleteOrg = async (req: Request, res: Response) => {
    try {
        let resp = await OrgRepository.deleteOrg(req.params.id);
        console.log("Delete organizations Response for id: %s", req.params.id, resp);
        res.status(status.success).json({
          message: "Organization deleted successfully",
        });
    } catch (error: any) {
        res.status(status.bad).send({ error: error.message });
    }
}

export const searchOrgs = async (req: Request, res: Response) => {
    try {
        if (!req.params.search || req.params.search.length < 3) {
            res.status(status.bad).send({ error: "Please provide at least 3 char to search"});
            return;
        }

        const { offset, limit } = getOffsetAndLimitFromRequest(req);
        const orgs = await OrgRepository.getOrgs( {name: req.params.search}, offset, limit);
        res.status(status.success).send(orgs);
        return;
    } catch (error: any) {
        res.status(status.bad).send({ error: error.message });
        return;
    }
};