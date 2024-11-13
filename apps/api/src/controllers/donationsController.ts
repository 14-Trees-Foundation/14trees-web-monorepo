
import { status } from "../helpers/status";
import { DonationRepository } from "../repo/donationsRepo";
import { getOffsetAndLimitFromRequest } from "./helper/request";
import { Request, Response } from "express";
import { getWhereOptions } from "./helper/filters";
import { FilterItem } from "../models/pagination";
import { DonationCreationAttributes, Donation } from "../models/donation";
import { DonationUserCreationAttributes } from "../models/donation_user";
import { UserRepository } from "../repo/userRepo";
import { DonationUserRepository } from "../repo/donationUsersRepo";
import { createWorkOrderInCSV } from "./helper/uploadtocsv";

/*
    Model - Donation
    CRUD Operations for donations collection
*/

export const getDonations = async (req: Request, res: Response) => {
    const { offset, limit } = getOffsetAndLimitFromRequest(req);
    const filters: FilterItem[] = req.body?.filters;

    try {
        let result = await DonationRepository.getDonations(offset, limit, filters);
        res.status(status.success).send(result);
    } catch (error: any) {
        res.status(status.error).json({
            status: status.error,
            message: error.message,
        });
    }
}


export const addDonation = async (req: Request, res: Response) => {

    const data = req.body;
    const usersData = data.users || [];

    let obj: any = {
        // name: data.name,
        pledged: data.no_of_trees ? data.no_of_trees : data.no_of_acres ? data.no_of_acres + ' acres' : null,
        // email_address: data.email,
        // phone: data.phone,
        grove: data.grove,
        // land_type: data.land_type,
        pan_number: data.pan,
        associated_tag: data.tag,
        // py: new Date().toISOString(),
        created_at: new Date(),
        updated_at: new Date(),
    }

    try {
        const user = await UserRepository.addUser(data);
        
        const donation = await DonationRepository.addDonation(obj)
        let donationUsers: DonationUserCreationAttributes[] = [];
        for (const userDetails of usersData) {
            const user = await UserRepository.upsertUser(userDetails);
            donationUsers.push({
                donation_id: donation.id,
                user_id: user.id,
                gifted_trees: userDetails.gifted_trees,
                created_at: new Date(),
            })
        }

        if (donationUsers.length !== 0) await DonationUserRepository.createDonationUsers(donationUsers)
        res.status(status.success).json(donation);

    } catch (error: any) {
        console.log("[ERROR]", "addDonation", error)
        res.status(status.error).json({
            status: status.error,
            message: 'Something went wrong!',
        });
        return;
    }
}

export const deleteDonation = async (req: Request, res: Response) => {
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

export const createWorkOrder = async (req: Request, res: Response) => {
    const donationId = req.params.donation_id
    if (!donationId || isNaN(parseInt(donationId))) {
        res.status(status.bad).json({ message: 'Invalid request' });
        return;
    }

    try {
        let result = await DonationRepository.getDonations(0, 1, [{ columnField: 'id', operatorValue: 'equals', value: donationId }])
        if (result.results.length === 0) {
            res.status(status.notfound).json({ message: 'Donation not found' });
            return;
        }

        const donation = JSON.parse(JSON.stringify(result.results[0]));
        if (parseInt(donation.pledged) <= parseInt(donation.assigned_trees)) {
            res.status(status.success).json({ message: 'No need to create work order. All trees are assigned' });
            return;
        }
        
        await createWorkOrderInCSV(donation)

        res.status(status.created).send();
    } catch (error) {
        console.log(error)
        res.status(status.error).json({ error: error });
    }
}