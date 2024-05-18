import { Request, Response } from "express";
import { status } from "../helpers/status";
import OrgModel, { OrgDocument } from "../models/org";
import csvhelper from "./helper/uploadtocsv";
import { getOffsetAndLimitFromRequest } from "./helper/request";
import { getQueryExpression } from "./helper/filters";

export const getOrgs = async (req: Request, res: Response) => {
    const { offset, limit } = getOffsetAndLimitFromRequest(req);
    let filters: any = {};
    if (req.body.filters) {
        req.body.filters.array.forEach((element: any) => {
            const filter = getQueryExpression(element.columnField, element.operatorValue, element.value);
            filters = {...filters, ...filter};  
        });
    }
    try {
        const result = await OrgModel.find(filters).skip(offset).limit(limit);
        res.status(status.success).send(result);
    } catch (error: any) {
        res.status(status.error).json({
            status: status.error,
            message: error.message,
        });
    }
};

export const addOrg = async (req: Request, res: Response) => {
    if (!req.body.name) {
        res.status(status.bad).send({ error: "Organization name is required" });
        return;
    }

    const obj = {
        name: req.body.name,
        date_added: new Date().toISOString(),
        desc: req.body.desc ? req.body.desc : "",
        type: req.body.type ? req.body.type : "",
    };
    const org = new OrgModel(obj);

    let orgRes: OrgDocument | undefined;
    try {
        orgRes = await org.save();
    } catch (error: any) {
        res.status(status.bad).json({
            error: error,
        });
        return;
    }

    // Save the info into the sheet
    try {
        csvhelper.UpdateOrg(obj);
        res.status(status.created).json({
            org: orgRes,
            csvupload: "Success",
        });
    } catch (error: any) {
        res.status(status.error).json({
            org: orgRes,
            csvupload: "Failure",
        });
    }
};

export const updateOrg = async (req: Request, res: Response) => {
    try {
        const org = await OrgModel.findById(req.params.id);
        if (!org) {
            throw new Error("Organization not found for given id");
        }

        if (req.body.name) {
            org.name = req.body.name;
        }
        if (req.body.desc) {
            org.desc = req.body.desc;
        }
        if (req.body.type) {
            org.type = req.body.type;
        }

        const updatedOrg = await org.save();
        res.status(status.success).send(updatedOrg);
    } catch (error: any) {
        res.status(status.bad).send({ error: error.message });
    }
};

export const deleteOrg = async (req: Request, res: Response) => {
    try {
        const response = await OrgModel.findByIdAndDelete(req.params.id).exec();
        console.log("Delete Org Response for orgId: %s", req.params.id, response);

        res.status(status.success).send({
            message: "Organization deleted successfully",
        });
    } catch (error: any) {
        res.status(status.bad).send({ error: error.message });
    }
};

export const searchOrgs = async (req: Request, res: Response) => {
    try {
        if (!req.params.search || req.params.search.length < 3) {
            res.status(status.bad).send({ error: "Please provide at least 3 characters to search" });
            return;
        }
  
        const { offset, limit } = getOffsetAndLimitFromRequest(req);
        const regex = new RegExp(req.params.search, 'i');
        const orgs = await OrgModel.find({ name: { $regex: regex }}).skip(offset).limit(limit);
        res.status(status.success).send(orgs);
    } catch (error: any) {
        res.status(status.bad).send({ error: error.message });
    }
};
