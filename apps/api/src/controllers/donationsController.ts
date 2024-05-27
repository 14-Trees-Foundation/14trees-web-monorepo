
import { status } from "../helpers/status";
import { DonationRepository } from "../repo/donationsRepo";
import { getOffsetAndLimitFromRequest } from "./helper/request";
import { Request, Response } from "express";
  

/*
    Model - Donation
    CRUD Operations for donations collection
*/

export const getDonations = async (req: Request, res: Response) => {
    const {offset, limit } = getOffsetAndLimitFromRequest(req);
    try {
        let result = await DonationRepository.getDonations(offset, limit);
        res.status(status.success).send(result);
    } catch (error: any) {
        res.status(status.error).json({
            status: status.error,
            message: error.message,
        });
    }
}