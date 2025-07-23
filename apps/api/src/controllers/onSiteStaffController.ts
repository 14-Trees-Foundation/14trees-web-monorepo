import { status } from "../helpers/status";
import { OnsiteStaff } from "../models/onsitestaff";
import { OnsiteStaffRepository } from "../repo/onSiteStaffRepo";
import { getOffsetAndLimitFromRequest } from "./helper/request";
import { getUserId } from "./helper/users";
import { Request, Response } from "express";

/*
    Model - onSiteStaff
    CRUD Operations for onsitestaff collection
*/

export const getOnsiteStaffs = async (req: Request, res: Response) => {
    const { offset, limit } = getOffsetAndLimitFromRequest(req);
    try {
        const result = await OnsiteStaffRepository.getOnsiteStaffs(offset, limit);
        res.status(status.success).send(result);
    } catch(error: any) {
        res.status(status.error ).json({
            status: status.error,
            message: error.message,
        });
    }
}

export const addOnsiteStaff = async (req: Request, res: Response) => {
    try {
        if (!req.body.name) {
            throw new Error("Staff name is required");
        }

        const result = await OnsiteStaffRepository.addOnsiteStaff(req.body);
        res.status(status.success).send(result);
    } catch(error: any) {
        res.status(status.error).json({
            status: status.error,
            message: error.message,
        });
    }
}


export const updateOnsiteStaff = async (req: Request, res: Response) => {
    try {
        let staff = await OnsiteStaffRepository.updateOnsiteStaff(req.body);
        res.status(status.success).send(staff)
    } catch(error: any) {
        res.status(status.error).json({
            status: status.error,
            message: error.message,
        });
    }
}


export const deleteOnsiteStaff = async (req: Request, res: Response) => {
    try {
        let resp = await OnsiteStaffRepository.deleteOnsiteStaff(req.params.id);
        console.log(`Deleted OnsiteStaff with id: ${req.params.id}`, resp);
        res.status(status.success).json("OnsiteStaff deleted successfully");
    } catch (error : any) {
        res.status(status.error).json({
          status: status.error,
          message: error.message,
        });
    }
}
