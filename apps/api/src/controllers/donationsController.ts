
import { status } from "../helpers/status";
import { DonationRepository } from "../repo/donationsRepo";
import { getOffsetAndLimitFromRequest } from "./helper/request";
import { Request, Response } from "express";
import { getWhereOptions } from "./helper/filters";
import { FilterItem } from "../models/pagination";
import { DonationCreationAttributes } from "../models/donation";

  

/*
    Model - Donation
    CRUD Operations for donations collection
*/

export const getDonations = async (req: Request, res: Response) => {
    const {offset, limit } = getOffsetAndLimitFromRequest(req);
    const filters: FilterItem[] = req.body?.filters;
    let whereClause = {};

    if (filters && filters.length > 0) {
        filters.forEach(filter => {
            whereClause = { ...whereClause, ...getWhereOptions(filter.columnField, filter.operatorValue, filter.value) }
        })
    }

    
    try {
        let result = await DonationRepository.getDonations(offset, limit , whereClause);
        res.status(status.success).send(result);
    } catch (error: any) {
        res.status(status.error).json({
            status: status.error,
            message: error.message,
        });
    }
}


export const addDonation = async (req: Request , res: Response) =>{
    
    const data = req.body;
    
    let obj: DonationCreationAttributes = {
        name: data.name,
        pledged: data.no_of_trees ? data.no_of_trees : data.no_of_acres ? data.no_of_acres + ' acres' : null,
        email_address: data.email_address,
        grove: data.grove,
        land_type: data.site_type,
        pan: data.pan,
        date_received: new Date().toISOString(),
        created_at: new Date(),
        updated_at: new Date(),
    } 

    try {
        let result = await DonationRepository.addDonation(obj) 
        res.status(status.success).send(result);
    } catch (error: any) {
        res.status(status.error).json({
            status: status.error,
            message: error.message,
        });
    }


    
}

export const deleteDonation = async(req: Request , res: Response)=>{
          try {
            let response = await DonationRepository.deleteDonation(req.params.id);
            
            console.log("Delete Donation Response for id: %s", req.params.id, response);
       
            res.status(status.success).json({
            message: "Donation deleted successfully",
            });

          } catch (error: any) {
            res.status(status.bad).send({ error: error.message });
          }
}


export const updateDonation = async (req: Request, res: Response) => {
    try {
        let result = await DonationRepository.updateDonation(req.body)
        res.status(status.created).json(result);
    } catch (error) {
        console.log(error)
        res.status(status.error).json({ error: error });
    }
}