
import { status } from "../helpers/status";
import { DonationRepository } from "../repo/donationsRepo";
import { getOffsetAndLimitFromRequest } from "./helper/request";
import { Request, Response } from "express";
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
        console.log("[ERROR]", "DonationsController::getDonations", error)
        res.status(status.error).json({
            status: status.error,
            message: 'Something went wrong. Please try again after some time!',
        });
        return;
    }
}


export const createDonation = async (req: Request, res: Response) => {

    const data = req.body;
    const { 
        request_id, users, user_id, group_id, 
        category, grove, pledged, pledged_area, 
        preference, payment_id, event_name, 
        alternate_email, created_by, logo } = data;

    if (!request_id || !user_id || !category || !created_by) {
        res.status(status.bad).json({
            message: 'Please provide valid input details!'
        });
        return;
    }

    const donationRequest: DonationCreationAttributes = {
        request_id: request_id,
        user_id: user_id,
        group_id: group_id,
        category: category,
        grove: grove,
        pledged: pledged,
        pledged_area: pledged_area,
        preference: preference,
        payment_id: payment_id,
        event_name: event_name?.trim() || null,
        alternate_email: alternate_email?.trim() || null,
        logo: logo || null,
        created_by: created_by,
        created_at: new Date(),
        updated_at: new Date(),
    };

    try {

        const donation = await DonationRepository.createdDonation(donationRequest);
        if (users && users.length > 0) {
            const donationUsers: DonationUserCreationAttributes[] = [];
            for (const user of users) {
                const userData = {
                    name: user.name,
                    phone: user.phone,
                    email: user.email,
                };

                const userResponse = await UserRepository.upsertUser(userData);

                donationUsers.push({
                    user_id: userResponse.id,
                    donation_id: donation.id,
                    gifted_trees: user.gifted_trees,
                    created_at: new Date(),
                    updated_at: new Date(),
                });
            }
            
            if (donationUsers.length !== 0) await DonationUserRepository.createDonationUsers(donationUsers)
        }

        res.status(status.success).json(donation);
    } catch (error: any) {
        console.log("[ERROR]", "DonationsController::createDonation", error)
        res.status(status.error).json({
            status: status.error,
            message: 'Something went wrong. Please try again after some time!',
        });
        return;
    }
}

export const deleteDonation = async (req: Request, res: Response) => {
    const { donation_id } = req.params;
    const donationId = parseInt(donation_id);
    if (isNaN(donationId)) {
        res.status(status.bad).json({ message: 'Invalid request' });
        return;
    }

    try {

        // Delete donation users
        await DonationUserRepository.deleteDonationUsers({ donation_id: donationId });

        // delete donation
        let response = await DonationRepository.deleteDonation(donationId);

        res.status(status.success).json({
            message: "Donation deleted successfully",
        });

    } catch (error: any) {
        console.log("[ERROR]", "DonationsController::deleteDonation", error)
        res.status(status.error).json({
            status: status.error,
            message: 'Something went wrong. Please try again after some time!',
        });
        return;
    }
}


export const updateDonation = async (req: Request, res: Response) => {
    try {
        let result = await DonationRepository.updateDonation(req.body)
        const donations = await DonationRepository.getDonations(0, 1, [{ columnField: 'id', operatorValue: 'equals', value: result.id }])
        res.status(status.created).json(donations.results.length === 1 ? donations.results[0] : result);
    } catch (error) {
        console.log("[ERROR]", "DonationsController::updateDonation", error)
        res.status(status.error).json({
            status: status.error,
            message: 'Something went wrong. Please try again after some time!',
        });
        return;
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

export const updateFeedback = async (req: Request, res: Response) => {
    const { feedback, source_info, request_id } = req.body;
    try {
        const resp = await DonationRepository.getDonations(0, 1, [{ columnField: 'request_id', operatorValue: 'equals', value: request_id }])
        if (resp.results.length === 1) {
            const donation = resp.results[0];
            donation.feedback = feedback;
            donation.source_info = source_info;
            await DonationRepository.updateDonation(donation);
        };

        res.status(status.success).send();
    } catch (error) {
        console.log("[ERROR]", "DonationsController::updateFeedback", error)
        res.status(status.error).json({
            status: status.error,
            message: 'Something went wrong. Please try again after some time!',
        });
        return;
    }
}