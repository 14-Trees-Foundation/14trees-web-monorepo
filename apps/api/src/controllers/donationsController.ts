
import { status } from "../helpers/status";
import { DonationRepository } from "../repo/donationsRepo";
import { getOffsetAndLimitFromRequest } from "./helper/request";
import { Request, Response } from "express";
import { FilterItem } from "../models/pagination";
import { Donation, DonationCreationAttributes } from "../models/donation";
import { DonationUser, DonationUserCreationAttributes } from "../models/donation_user";
import { UserRepository } from "../repo/userRepo";
import { DonationUserRepository } from "../repo/donationUsersRepo";
import { createWorkOrderInCSV } from "./helper/uploadtocsv";
import TreeRepository from "../repo/treeRepo";
import { sendDashboardMail } from "../services/gmail/gmail";
import { UserRelationRepository } from "../repo/userRelationsRepo";
import { UserGroupRepository } from "../repo/userGroupRepo";

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

const upsertDonationUsers = async (donation: Donation, users: any[]) => {
    const donationUsers: DonationUserCreationAttributes[] = [];
    const existingDonationUsers: DonationUser[] = await DonationUserRepository.getDonationUsers(donation.id);

    for (const user of users) {
        const recipientData = {
            id: user.recipient,
            name: user.recipient_name,
            phone: user.recipient_phone,
            email: user.recipient_email,
        };
        const recipient = await UserRepository.upsertUser(recipientData);

        const assigneeData = {
            id: user.assignee,
            name: user.assignee_name,
            phone: user.assignee_phone,
            email: user.assignee_email,
        };
        const assignee = await UserRepository.upsertUser(assigneeData);

        if (recipient.id !== assignee.id && user.relation?.trim()) {
            await UserRelationRepository.createUserRelation({
                primary_user: recipient.id,
                secondary_user: assignee.id,
                relation: user.relation.trim(),
                created_at: new Date(),
                updated_at: new Date(),
            })
        }

        if (user.id && existingDonationUsers.find((donationUser) => donationUser.id === user.id)) {
            await DonationUserRepository.updateDonationUsers({
                recipient: recipient.id,
                assignee: assignee.id,
                gifted_trees: user.count,
                updated_at: new Date(),
            }, { id: user.id });
        } else {
            donationUsers.push({
                recipient: recipient.id,
                assignee: assignee.id,
                donation_id: donation.id,
                gifted_trees: user.count,
                profile_image_url: user.image_url || null,
                created_at: new Date(),
                updated_at: new Date(),
            });
        }
    }

    if (donationUsers.length !== 0) await DonationUserRepository.createDonationUsers(donationUsers);
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
            await upsertDonationUsers(donation, users);
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
    const { donation, users } = req.body;
    try {
        let result = await DonationRepository.updateDonation(donation);
        await upsertDonationUsers(result, users);
        
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

        await createWorkOrderInCSV(donation);

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

export const getDonationUsers = async (req: Request, res: Response) => {
    const { donation_id } = req.params;
    const donationId = parseInt(donation_id);
    if (isNaN(donationId)) {
        res.status(status.bad).json({ message: 'Invalid request' });
        return;
    }

    try {
        const donationUsers = await DonationUserRepository.getDonationUsers(donationId);
        res.status(status.success).json(donationUsers);
    } catch (error: any) {
        console.log("[ERROR]", "DonationsController::getDonationUsers", error)
        res.status(status.error).json({
            status: status.error,
            message: 'Something went wrong. Please try again after some time!',
        });
        return;
    }
}

export const bookTreesForDonation = async (req: Request, res: Response) => {
    const { donation_id, plot_ids, trees, diversify } = req.body;
    if (!donation_id || ((!plot_ids && plot_ids.length === 0) && (!trees && trees.length === 0))) {
        res.status(status.bad).json({ message: 'Invalid input provided!' });
        return;
    }

    try {
        const donationResp = await DonationRepository.getDonations(0, 1, [{ columnField: 'id', operatorValue: 'equals', value: donation_id }])
        if (donationResp.results.length === 0) {
            res.status(status.notfound).json({ message: 'Donation not found' });
            return;
        }

        const donation = donationResp.results[0];
        if (!donation.pledged) {
            res.status(status.bad).json({ message: 'Donor has pledged area!' });
            return;
        }

        let addUserToDonorGroup = false;
        if (trees.length !== 0) {
            const treeIds = trees.map((tree: any) => tree.tree_id);
            await TreeRepository.mapTreesToUserAndGroup(donation.user_id, donation.group_id, treeIds, donation.id);
            if (treeIds.length > 0) addUserToDonorGroup = true;

            for (const tree of trees) {
                const updateConfig: any = {
                    assigned_to: tree.assignee,
                    gifted_to: tree.recipient,
                    description: donation.event_name,
                    assigned_at: new Date(),
                    updated_at: new Date(),
                }

                await TreeRepository.updateTrees(updateConfig, { id: tree.tree_id });
            }
        } else {
            if (donation.pledged) {
                const treeIds = await TreeRepository.mapTreesInPlotToUserAndGroup(donation.user_id, donation.group_id, plot_ids, donation.pledged, true, diversify, false, donation.id);
                if (treeIds.length === 0) {
                    res.status(status.bad).json({
                        message: 'Enough trees not available for this request!'
                    })
                    return;
                }
                addUserToDonorGroup = true;
            }
        }

        // add user to donations group
        if (addUserToDonorGroup) await UserGroupRepository.addUserToDonorGroup(donation.user_id);

        res.status(status.success).send();
    } catch (error: any) {
        console.log("[ERROR]", "DonationsController::bookTreesForDonation", error)
        res.status(status.error).json({
            status: status.error,
            message: 'Something went wrong. Please try again after some time!',
        });
        return;
    }
}


export const sendAckMail = async (req: Request, res: Response) => {
    const { donation_id: donationId, cc_mails: ccMails, test_mails: testMails } = req.body;
    if (!donationId) {
        res.status(status.bad).json({ message: 'Invalid request' });
        return;
    }

    try {
        const donationResp = await DonationRepository.getDonations(0, 1, [{ columnField: 'id', operatorValue: 'equals', value: donationId }])
        if (donationResp.results.length === 0) {
            res.status(status.notfound).json({ message: 'Donation not found' });
            return;
        }

        const donation = donationResp.results[0];
        const emailTemplate = 'donor-ack.html';
        const subject = 'Thank you for your donation';

        const mailAddress = (testMails && testMails.length > 0) ? testMails : [(donation as any).user_email];
        const emailData = {
            ...donation,
            is_pledged: donation.pledged ? true : false,
            is_grove: donation.grove ? true : false,
            is_event_name: donation.event_name ? true : false,
            is_alternate_email: donation.alternate_email ? true : false,
        }
        const statusMessage: string = await sendDashboardMail(emailTemplate, emailData, mailAddress, ccMails, undefined, subject);
        res.status(status.success).send();
    } catch (error: any) {
        console.log("[ERROR]", "DonationsController::sendAckMail", error)
        res.status(status.error).json({
            status: status.error,
            message: 'Something went wrong. Please try again after some time!',
        });
        return;
    }
}