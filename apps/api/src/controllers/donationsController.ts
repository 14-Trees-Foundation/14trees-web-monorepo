
import { status } from "../helpers/status";
import { DonationRepository } from "../repo/donationsRepo";
import { getOffsetAndLimitFromRequest } from "./helper/request";
import { Request, Response } from "express";
import { FilterItem } from "../models/pagination";
import { DonationService } from "../facade/donationService";

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
        return res.status(status.error).json({
            status: status.error,
            message: 'Something went wrong. Please try again after some time!',
        });
    }
}

// const upsertDonationUsers = async (donation: Donation, users: any[]) => {
//     const donationUsers: DonationUserCreationAttributes[] = [];
//     const existingDonationUsers: DonationUser[] = await DonationUserRepository.getDonationUsers(donation.id);

//     for (const user of users) {
//         const recipientData = {
//             id: user.recipient,
//             name: user.recipient_name,
//             phone: user.recipient_phone,
//             email: user.recipient_email,
//         };
//         const recipient = await UserRepository.upsertUser(recipientData);

//         const assigneeData = {
//             id: user.assignee,
//             name: user.assignee_name,
//             phone: user.assignee_phone,
//             email: user.assignee_email,
//         };
//         const assignee = await UserRepository.upsertUser(assigneeData);

//         if (recipient.id !== assignee.id && user.relation?.trim()) {
//             await UserRelationRepository.createUserRelation({
//                 primary_user: recipient.id,
//                 secondary_user: assignee.id,
//                 relation: user.relation.trim(),
//                 created_at: new Date(),
//                 updated_at: new Date(),
//             })
//         }

//         if (user.id && existingDonationUsers.find((donationUser) => donationUser.id === user.id)) {
//             await DonationUserRepository.updateDonationUsers({
//                 recipient: recipient.id,
//                 assignee: assignee.id,
//                 gifted_trees: user.count,
//                 updated_at: new Date(),
//             }, { id: user.id });
//         } else {
//             donationUsers.push({
//                 recipient: recipient.id,
//                 assignee: assignee.id,
//                 donation_id: donation.id,
//                 gifted_trees: user.count,
//                 profile_image_url: user.image_url || null,
//                 created_at: new Date(),
//                 updated_at: new Date(),
//             });
//         }
//     }

//     if (donationUsers.length !== 0) await DonationUserRepository.createDonationUsers(donationUsers);
// }

export const createDonation = async (req: Request, res: Response) => {

    const data = req.body;
    const {
        sponsor_name, sponsor_email, sponsor_phone, payment_id, category, grove,
        grove_type_other, trees_count, contribution_options, names_for_plantation,
        comments, users
    } = data;

    // Validate sponsor details
    if (!sponsor_name || !sponsor_email)
        return res.status(status.bad).json({
            message: 'Invalid sponsor name or email. Please provide valid details!'
        });

    // Validate tree plantaion details
    if (!trees_count || !category || !grove)
        return res.status(status.bad).json({
            message: 'Land and tree plantation details are invalid. Please provide valid details!'
        });


    const donation = await DonationService.createDonation({
        sponsor_name,
        sponsor_email,
        sponsor_phone,
        trees_count,
        payment_id,
        category,
        grove,
        continution_options: contribution_options,
    }).catch((error) => {
        console.error("[ERROR] DonationsController::createDonation:", error);
        res.status(status.error).json({
            message: 'Failed to create donation'
        });
    })

    let usersCreated = false;
    if (!donation) return;
    if (users && users.length > 0) {
        await DonationService.createDonationUsers(
            donation.id,
            users
        ).catch((error) => {
            console.error("[ERROR] DonationsController::createDonation:", error);
            usersCreated = false;
        })
    }
    
    if (!usersCreated)
        return res.status(status.error).send({
            message: "Failed to save recipient details."
        })
    
    return res.status(status.created).send(donation);
};

export const deleteDonation = async (req: Request, res: Response) => {
    try {
        const donationId = parseInt(req.params.id);

        if (isNaN(donationId)) {
            console.log('Invalid ID received:', req.params.id);
            return res.status(status.bad).json({
                message: 'Invalid donation ID'
            });
        }

        await DonationRepository.deleteDonation(donationId);
        return res.status(status.success).json({
            message: 'Donation deleted successfully'
        });
    } catch (error: any) {
        console.error("[ERROR] DonationsController::deleteDonation:", error);
        if (error.message.includes('not found')) {
            return res.status(status.notfound).json({
                message: 'Donation not found'
            });
        }
        return res.status(status.error).json({
            message: 'Failed to delete donation'
        });
    }
};

export const updateDonation = async (req: Request, res: Response) => {
    const { id } = req.params;
    const updateFields: string[] = req.body.updateFields; // Fields to update (mask)
    const updateData = req.body.data; // New data

    const donationId = parseInt(id);
    if (isNaN(donationId))
        return res.status(status.bad).json({
            message: 'Invalid donation ID'
        });
    
    if (!updateFields || !updateData) {
      return res.status(400).json({ message: "Invalid request format" });
    }

    // Build dynamic update object
    let updateObject: Record<string, any> = {};
    updateFields.forEach((field) => {
      if (updateData[field] !== undefined) {
        updateObject[field] = updateData[field];
      }
    });

    try {
        const updatedDonation = await DonationRepository.updateDonation(donationId, updateFields);

        // Get full donation details with joins
        const result = await DonationRepository.getDonations(0, 1, [
            { columnField: 'id', operatorValue: 'equals', value: updatedDonation.id }
        ]);

        res.status(status.success).json(
            result.results.length === 1 ? result.results[0] : updatedDonation
        );
    } catch (error) {
        console.error("[ERROR] DonationsController::updateDonation:", error);
        res.status(status.error).json({
            message: 'Failed to update donation'
        });
    }
};

// export const createWorkOrder = async (req: Request, res: Response) => {
//     const donationId = req.params.donation_id
//     if (!donationId || isNaN(parseInt(donationId))) {
//         res.status(status.bad).json({ message: 'Invalid request' });
//         return;
//     }

//     try {
//         let result = await DonationRepository.getDonations(0, 1, [{ columnField: 'id', operatorValue: 'equals', value: donationId }])
//         if (result.results.length === 0) {
//             res.status(status.notfound).json({ message: 'Donation not found' });
//             return;
//         }

//         const donation = JSON.parse(JSON.stringify(result.results[0]));
//         if (parseInt(donation.pledged) <= parseInt(donation.assigned_trees)) {
//             res.status(status.success).json({ message: 'No need to create work order. All trees are assigned' });
//             return;
//         }

//         await createWorkOrderInCSV(donation);

//         res.status(status.created).send();
//     } catch (error) {
//         console.log(error)
//         res.status(status.error).json({ error: error });
//     }
// }

// export const updateFeedback = async (req: Request, res: Response) => {
//     const { feedback, source_info, request_id } = req.body;
//     try {
//         const resp = await DonationRepository.getDonations(0, 1, [{ columnField: 'request_id', operatorValue: 'equals', value: request_id }])
//         if (resp.results.length === 1) {
//             const donation = resp.results[0];
//             donation.feedback = feedback;
//             donation.source_info = source_info;
//             await DonationRepository.updateDonation(donation);
//         };

//         res.status(status.success).send();
//     } catch (error) {
//         console.log("[ERROR]", "DonationsController::updateFeedback", error)
//         res.status(status.error).json({
//             status: status.error,
//             message: 'Something went wrong. Please try again after some time!',
//         });
//         return;
//     }
// }

// export const getDonationUsers = async (req: Request, res: Response) => {
//     const { donation_id } = req.params;
//     const donationId = parseInt(donation_id);
//     if (isNaN(donationId)) {
//         res.status(status.bad).json({ message: 'Invalid request' });
//         return;
//     }

//     try {
//         const donationUsers = await DonationUserRepository.getDonationUsers(donationId);
//         res.status(status.success).json(donationUsers);
//     } catch (error: any) {
//         console.log("[ERROR]", "DonationsController::getDonationUsers", error)
//         res.status(status.error).json({
//             status: status.error,
//             message: 'Something went wrong. Please try again after some time!',
//         });
//         return;
//     }
// }

// export const bookTreesForDonation = async (req: Request, res: Response) => {
//     const { donation_id, plot_ids, trees, diversify } = req.body;
//     if (!donation_id || ((!plot_ids && plot_ids.length === 0) && (!trees && trees.length === 0))) {
//         res.status(status.bad).json({ message: 'Invalid input provided!' });
//         return;
//     }

//     try {
//         const donationResp = await DonationRepository.getDonations(0, 1, [{ columnField: 'id', operatorValue: 'equals', value: donation_id }])
//         if (donationResp.results.length === 0) {
//             res.status(status.notfound).json({ message: 'Donation not found' });
//             return;
//         }

//         const donation = donationResp.results[0];
//         if (!donation.pledged) {
//             res.status(status.bad).json({ message: 'Donor has pledged area!' });
//             return;
//         }

//         let addUserToDonorGroup = false;
//         if (trees.length !== 0) {
//             const treeIds = trees.map((tree: any) => tree.tree_id);
//             await TreeRepository.mapTreesToUserAndGroup(donation.user_id, donation.group_id, treeIds, donation.id);
//             if (treeIds.length > 0) addUserToDonorGroup = true;

//             for (const tree of trees) {
//                 const updateConfig: any = {
//                     assigned_to: tree.assignee,
//                     gifted_to: tree.recipient,
//                     description: donation.event_name,
//                     assigned_at: new Date(),
//                     updated_at: new Date(),
//                 }

//                 await TreeRepository.updateTrees(updateConfig, { id: tree.tree_id });
//             }
//         } else {
//             if (donation.pledged) {
//                 const treeIds = await TreeRepository.mapTreesInPlotToUserAndGroup(donation.user_id, donation.group_id, plot_ids, donation.pledged, true, diversify, false, donation.id);
//                 if (treeIds.length === 0) {
//                     res.status(status.bad).json({
//                         message: 'Enough trees not available for this request!'
//                     })
//                     return;
//                 }
//                 addUserToDonorGroup = true;
//             }
//         }

//         // add user to donations group
//         if (addUserToDonorGroup) await UserGroupRepository.addUserToDonorGroup(donation.user_id);

//         res.status(status.success).send();
//     } catch (error: any) {
//         console.log("[ERROR]", "DonationsController::bookTreesForDonation", error)
//         res.status(status.error).json({
//             status: status.error,
//             message: 'Something went wrong. Please try again after some time!',
//         });
//         return;
//     }
// }


// export const sendAckMail = async (req: Request, res: Response) => {
//     const { donation_id: donationId, cc_mails: ccMails, test_mails: testMails } = req.body;
//     if (!donationId) {
//         res.status(status.bad).json({ message: 'Invalid request' });
//         return;
//     }

//     try {
//         const donationResp = await DonationRepository.getDonations(0, 1, [{ columnField: 'id', operatorValue: 'equals', value: donationId }])
//         if (donationResp.results.length === 0) {
//             res.status(status.notfound).json({ message: 'Donation not found' });
//             return;
//         }

//         const donation = donationResp.results[0];
//         const emailTemplate = 'donor-ack.html';
//         const subject = 'Thank you for your donation';

//         const mailAddress = (testMails && testMails.length > 0) ? testMails : [(donation as any).user_email];
//         const emailData = {
//             ...donation,
//             is_pledged: donation.pledged ? true : false,
//             is_grove: donation.grove ? true : false,
//             is_event_name: donation.event_name ? true : false,
//             is_alternate_email: donation.alternate_email ? true : false,
//         }
//         const statusMessage: string = await sendDashboardMail(emailTemplate, emailData, mailAddress, ccMails, undefined, subject);
//         res.status(status.success).send();
//     } catch (error: any) {
//         console.log("[ERROR]", "DonationsController::sendAckMail", error)
//         res.status(status.error).json({
//             status: status.error,
//             message: 'Something went wrong. Please try again after some time!',
//         });
//         return;
//     }
// }