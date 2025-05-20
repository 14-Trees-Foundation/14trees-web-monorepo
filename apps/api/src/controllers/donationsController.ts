import { status } from "../helpers/status"; 
import { DonationRepository } from "../repo/donationsRepo";
import { getOffsetAndLimitFromRequest } from "./helper/request";
import { Request, Response } from "express";
import { FilterItem } from "../models/pagination";
import { DonationService } from "../facade/donationService";
import { UserRepository } from "../repo/userRepo";
import { DonationUserRepository } from "../repo/donationUsersRepo";
import { SortOrder } from "../models/common";
import { EmailTemplateRepository } from "../repo/emailTemplatesRepo";
import { sendDashboardMail } from "../services/gmail/gmail";
import { TemplateType } from "../models/email_template";
import { Donation, DonationStatus_OrderFulfilled, DonationStatus_UserSubmitted } from '../models/donation';
import { Tree } from '../models/tree';
import { User } from '../models/user';
import { WhereOptions } from 'sequelize';
import { EmailTemplate } from '../models/email_template';

/*
    Model - Donation
    CRUD Operations for donations collection
*/

export const getDonations = async (req: Request, res: Response) => {
    const { offset, limit } = getOffsetAndLimitFromRequest(req);
    const filters: FilterItem[] = req.body?.filters;
    const orderBy: SortOrder[] = req.body?.order_by;

    try {
        let result = await DonationRepository.getDonations(offset, limit, filters, orderBy);
        res.status(status.success).send({
            offset: result.offset,
            total: Number(result.total),
            results: result.results.map((item: any) => {
                return {
                    ...item,
                    booked: Number(item.booked),
                    assigned: Number(item.assigned),
                }
            })
        });
    } catch (error: any) {
        console.log("[ERROR]", "DonationsController::getDonations", error)
        return res.status(status.error).json({
            status: status.error,
            message: 'Something went wrong. Please try again after some time!',
        });
    }
}

export const createDonation = async (req: Request, res: Response) => {

    const data = req.body;
    const {
        sponsor_name, sponsor_email, sponsor_phone, payment_id, category, grove, tags,
        grove_type_other, trees_count, pledged_area_acres, contribution_options, names_for_plantation,
        comments, users,  donation_type, donation_method, visit_date, amount_donated,
    } = data;

    // Validate sponsor details
    if (!sponsor_name || !sponsor_email)
        return res.status(status.bad).json({
            message: 'Invalid sponsor name or email. Please provide valid details!'
        });

        if (donation_type === 'adopt') {
            if (!visit_date) {
                return res.status(status.bad).json({
                    message: 'Visit date is required for tree adoption'
                });
            }
        } else if (donation_type === 'donate') {
            if (donation_method === 'amount' && !amount_donated) {
                return res.status(status.bad).json({
                    message: 'Amount is required for monetary donations'
                });
            }
            if (donation_method === 'trees' && !trees_count) {
                return res.status(status.bad).json({
                    message: 'Tree count is required for tree donations'
                });
            }
        } else {
            return res.status(status.bad).json({
                message: 'Invalid donation type'
            });

        }

    // Validate tree plantaion details
    if ( !category)
        return res.status(status.bad).json({
            message: 'Land and tree plantation details are invalid. Please provide valid details!'
        });


    const donation = await DonationService.createDonation({
        sponsor_name,
        sponsor_email,
        sponsor_phone, 
        trees_count,
        pledged_area_acres,
        payment_id,
        category,
        grove,
        continution_options: contribution_options || [],
        comments,
        donation_type,
        donation_method,
        visit_date,
        amount_donated,
        tags
    }).catch((error) => {
        console.error("[ERROR] DonationsController::createDonation:", error);
        res.status(status.error).json({
            message: 'Failed to create donation'
        });
    })

    let usersCreated = true; // Default to true, only set to false if users array exists but creation fails
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
    
    // Send acknowledgement email after donation is created
    try {
        // Fetch the user directly by using UserRepository
        const sponsorUser = await UserRepository.upsertUser({
            name: sponsor_name,
            email: sponsor_email,
            phone: sponsor_phone
        });
        
        // Update donation with additional fields if they were provided in the request
        if (grove_type_other) donation.grove_type_other = grove_type_other;
        if (names_for_plantation) donation.names_for_plantation = names_for_plantation;
        if (comments) donation.comments = comments;
        
        DonationService.sendDonationAcknowledgement(donation, sponsorUser);
        // Send notification to back office
        DonationService.sendDonationNotificationToBackOffice(donation, sponsorUser);
    } catch (error) {
        console.error("[ERROR] DonationsController::createDonation:sendAcknowledgement", error);
        // Don't fail the request if email sending fails
    }
    try {
        DonationService.insertDonationIntoGoogleSheet(
            donation,
            sponsor_name,
            sponsor_email,
            amount_donated
        );
    } catch (error) {
        console.error("[ERROR] DonationsController::insertDonationIntoGoogleSheet:", error);
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
        const updatedDonation = await DonationRepository.updateDonation(donationId, updateObject);

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


/*
    Tree Reservation/UnReservation APIs
*/

export const reserveTreesForDonation = async (req: Request, res: Response) => {
    const {
        donation_id, tree_ids, auto_reserve,
        plots, diversify, book_all_habits
    } = req.body;

    if (!donation_id)
        return res.status(status.bad).send({ message: "Donation Id requried to reserve trees." })

    if (!auto_reserve && (!tree_ids || tree_ids.length === 0)) 
        return res.status(status.bad).send({ message: "Tree Ids not provided." })
    
    if (auto_reserve && (!plots || plots.length === 0))
        return res.status(status.bad).send({ message: "Plese provided plots to reserve trees from." })

    try {
        if (auto_reserve) {
            await DonationService.autoReserveTrees(donation_id, plots, diversify, book_all_habits);
        } else {
            await DonationService.reserveSelectedTrees(donation_id, tree_ids);
        }
        return res.status(status.success).send();
    } catch (error: any) {
        console.log("[ERROR]", "donationsController::reserveTreesForDonation", error);
        return res.status(status.error).send({
            messgae: error.message
        })
    }

}


export const unreserveTreesForDonation = async (req: Request, res: Response) => {
    const {
        donation_id, tree_ids,
        unreserve_all
    } = req.body;

    if (!donation_id)
        return res.status(status.bad).send({ message: "Donation Id requried to reserve trees." })

    if (!unreserve_all && (!tree_ids || tree_ids.length === 0)) 
        return res.status(status.bad).send({ message: "Tree Ids not provided." })
    try {
        if (unreserve_all) {
            await DonationService.unreserveAllTrees(donation_id);
        } else {
            await DonationService.unreserveSelectedTrees(donation_id, tree_ids);
        }
    
        return res.status(status.success).send();
    } catch (error: any) {
        console.log("[ERROR]", "donationsController::unreserveTreesForDonation", error);
        return res.status(status.error).send({
            messgae: error.message
        })
    }
}


/*
    Tree Assign/Unassign APIs
*/


export const assignTrees = async (req: Request, res: Response) => {

    const {
        donation_id,
        auto_assign,
        user_trees
    } = req.body;

    if (!donation_id)
        return res.status(status.bad).send({ message: "Donation Id requried to reserve trees." })

    if (!auto_assign && (!user_trees || user_trees.length === 0)) 
        return res.status(status.bad).send({ message: "Tree Ids not provided." })

    try {
        if (auto_assign) {
            await DonationService.autoAssignTrees(donation_id);
        } else {
            await DonationService.assignTrees(donation_id, user_trees)
        }

        const donation: any = await DonationRepository.getDonation(donation_id);

        if (Number(donation.assigned) === donation.trees_count) {
            await DonationRepository.updateDonation(donation.id, { status: DonationStatus_OrderFulfilled }); 
        } else {
            await DonationRepository.updateDonation(donation.id, { status: DonationStatus_UserSubmitted }); 
        }
    
        return res.status(status.success).send();
    } catch (error: any) {
        console.log("[ERROR]", "donationsController::assignTrees", error);
        return res.status(status.error).send({
            messgae: error.message
        })
    }
}


export const unassignTrees = async (req: Request, res: Response) => {

    const {
        donation_id,
        unassign_all,
        tree_ids
    } = req.body;

    if (!donation_id)
        return res.status(status.bad).send({ message: "Donation Id requried to reserve trees." })

    if (!unassign_all && (!tree_ids || tree_ids.length === 0))
        return res.status(status.bad).send({ message: "Tree Ids not provided." })

    try {
        if (!unassign_all) {
            await DonationService.unassignTreesForDonationIdAndTreeIds(donation_id, tree_ids);
        } else {
            await DonationService.unassignTrees(donation_id);
        }
        return res.status(status.success).send();
    } catch (error: any) {
        console.log("[ERROR]", "donationsController::unassignTrees", error);
        return res.status(status.error).send({
            messgae: error.message
        })
    }
}


/**
 * Donation Trees
*/

export const getDonationTrees = async (req: Request, res: Response) => {

    const { offset, limit } = getOffsetAndLimitFromRequest(req);
    const filters: FilterItem[] = req.body?.filters;

    try {
        let result = await DonationRepository.getDonationTrees(offset, limit, filters);
        res.status(status.success).send(result);
    } catch (error: any) {
        console.log("[ERROR]", "DonationsController::getDonationTrees", error)
        return res.status(status.error).json({
            status: status.error,
            message: 'Something went wrong. Please try again after some time!',
        });
    }
}

export const getDonationReservationStats = async (req: Request, res: Response) => {
    const { donation_id } =  req.query;
    
    if (!donation_id || isNaN(parseInt(donation_id as string))) {
        return res.status(status.bad).json({
            status: status.bad,
            message: 'Invalid donation ID'
        });
    }

    try {
        const stats = await DonationService.getDonationReservationStats(parseInt(donation_id as string));
        res.status(status.success).json(stats);
    } catch (error: any) {
        console.log("[ERROR]", "DonationsController::getDonationReservationStats", error);
        return res.status(status.error).json({
            status: status.error,
            message: error.message || 'Failed to fetch reservation stats'
        });
    }
}

/**
 * Donation Users
 */

export const getDonationUsers = async (req: Request, res: Response) => {
    const { offset, limit } = getOffsetAndLimitFromRequest(req);
    const filters: FilterItem[] = req.body?.filters;

    try {
        let result = await DonationUserRepository.getDonationUsers(offset, limit, filters);
        res.status(status.success).send(result);
    } catch (error: any) {
        console.log("[ERROR]", "DonationsController::getDonationUsers", error)
        return res.status(status.error).json({
            status: status.error,
            message: 'Something went wrong. Please try again after some time!',
        });
    }
}


export const updateDonationUser = async (req: Request, res: Response) => {
    const { donation_id, user } = req.body;

    try {
        const donationUser = await DonationService.upsertDonationUser(donation_id, user);
        res.status(status.success).send(donationUser);
    } catch (error: any) {
        console.log("[ERROR]", "DonationsController::updateDonationUser", error)
        return res.status(status.error).json({
            status: status.error,
            message: 'Something went wrong. Please try again after some time!',
        });
    }
}

export const deleteDonationUser = async (req: Request, res: Response) => {
    const { donation_user_id } = req.params;
    const donationUserId = parseInt(donation_user_id);
    if (isNaN(donationUserId)) {
        return res.status(status.bad).send({
            message: "Invalid donation user id"
        })
    }

    try {
        await DonationService.deleteDonationUser(donationUserId);
        res.status(status.success).send();
    } catch (error: any) {
        console.log("[ERROR]", "DonationsController::deleteDonationUser", error)
        return res.status(status.error).json({
            status: status.error,
            message: error.message,
        });
    }
}

export const getDonationTags = async (req: Request, res: Response) => {
    const { offset, limit } = getOffsetAndLimitFromRequest(req);

    try {
        let result = await DonationRepository.getDonationTags(offset, limit);
        res.status(status.success).send(result);
    } catch (error: any) {
        console.log("[ERROR]", "DonationsController::getDonationTags", error)
        return res.status(status.error).json({
            status: status.error,
            message: 'Something went wrong. Please try again after some time!',
        });
    }
}

export const sendEmailForDonation = async (req: Request, res: Response) => {
    const { 
        donation_id, 
        test_mails, 
        sponsor_cc_mails,
        recipient_cc_mails,
        assignee_cc_mails, 
        event_type = 'default',  
        email_sponsor = true, 
        email_recipient = false,
        email_assignee = false
    } = req.body;

    if (!donation_id) {
        return res.status(400).json({ error: 'Donation ID is required' });
    }

    try {
        // Get donation details
        const donation = await DonationRepository.getDonation(donation_id);
        if (!donation) {
            return res.status(404).json({ error: 'Donation not found' });
        }

        // Get user details
        const userResult = await UserRepository.getUsers(0, 1, [
            { columnField: 'id', operatorValue: 'equals', value: donation.user_id }
        ]);
        
        if (!userResult?.results?.length) {
            return res.status(404).json({ error: 'User not found' });
        }
        
        const user = userResult.results[0];

        // Get trees associated with the donation
        const trees = await DonationRepository.getDonationTrees(0, -1, [
            { columnField: 'donation_id', operatorValue: 'equals', value: donation_id }
        ]);

        if (!trees?.results?.length) {
            return res.status(404).json({ error: 'No trees found for this donation' });
        }

        // Prepare tree data for email
        const treeData = trees.results.map(tree => ({
            sapling_id: tree.sapling_id,
            dashboard_link: `https://dashboard.14trees.org/profile/${tree.sapling_id}`,
            planted_via: (tree as any).planted_via || '14 Trees',
            plant_type: (tree as any).plant_type || '',
            scientific_name: (tree as any).scientific_name || '',
            card_image_url: (tree as any).card_image_url || '',
            event_name: (tree as any).event_name || '',
            assigned_to_name: (tree as any).assignee_name || 'Tree Planter', // Matches template
            assignee_name: (tree as any).assignee_name || '', // Keep for backward compatibility
            assignee_email: (tree as any).assignee_email || '',
            recipient_email: (tree as any).recipient_email || '',
            recipient_name: (tree as any).recipient_name || (tree as any).assignee_name || 'Recipient',
        }));

        // Common email data
        const commonEmailData = {
            trees: treeData,
            count: treeData.length,
            donation_id: donation.id,
            grove: donation.grove,
            category: donation.category,
            contribution_options: donation.contribution_options,
            names_for_plantation: donation.names_for_plantation,
            comments: donation.comments,
            event_name: (donation as any).event_name || '',
            event_type: event_type
        };

        // Initialize tracking variables
        let recipientsMap: Map<string, typeof treeData> | null = null;
        let assigneesMap: Map<string, typeof treeData> | null = null;
        let sponsorEmailSuccess = false;

        // Send email to sponsor if enabled
        if (email_sponsor) {
            const sponsorEmailData = {
                ...commonEmailData,
                user_name: user.name,
                name: user.name,
                email: user.email
            };

            const sponsorTemplateType: TemplateType = treeData.length > 1 ? 'sponsor-multi-trees' : 'sponsor-single-tree';
            const sponsorTemplates = await EmailTemplateRepository.getEmailTemplates({ 
                event_type, 
                template_type: sponsorTemplateType 
            });

            if (!sponsorTemplates?.length) {
                return res.status(404).json({ error: 'Sponsor email template not found' });
            }

            const statusMessage = await sendDashboardMail(
                sponsorTemplates[0].template_name,
                sponsorEmailData,
                test_mails || [user.email],
                sponsor_cc_mails || []
            );

            if (statusMessage) {
                return res.status(500).json({ error: `Failed to send sponsor email: ${statusMessage}` });
            }
            sponsorEmailSuccess = true;
        }

        // Send email to recipient if enabled
        if (email_recipient) {
            recipientsMap = new Map<string, typeof treeData>();
            
            treeData.forEach(tree => {
                if (tree.recipient_email) {
                    if (!recipientsMap!.has(tree.recipient_email)) {
                        recipientsMap!.set(tree.recipient_email, []);
                    }
                    recipientsMap!.get(tree.recipient_email)?.push(tree);
                }
            });

            const recipientTemplateType: TemplateType = treeData.length > 1 ? 'receiver-multi-trees' : 'receiver-single-tree';
            const recipientTemplates = await EmailTemplateRepository.getEmailTemplates({
                event_type,
                template_type: recipientTemplateType
            });

            if (!recipientTemplates?.length) {
                return res.status(404).json({ error: 'Recipient email template not found' });
            }

            // Send to each recipient
            for (const [recipientEmail, recipientTrees] of recipientsMap) {
                const recipientEmailData = {
                    ...commonEmailData,
                    user_name: recipientTrees[0].recipient_name,
                    assigned_to_name: recipientTrees[0].assignee_name,
                    email: recipientEmail,
                    trees: recipientTrees,
                    count: recipientTrees.length
                };

                const statusMessage = await sendDashboardMail(
                    recipientTemplates[0].template_name,
                    recipientEmailData,
                    test_mails || [recipientEmail],
                    recipient_cc_mails || []
                );

                if (statusMessage) {
                    return res.status(500).json({ 
                        error: `Failed to send recipient email to ${recipientEmail}: ${statusMessage}` 
                    });
                }
            }
        }

        // Send email to assignee if enabled
        if (email_assignee) {
            assigneesMap = new Map<string, typeof treeData>();
            
            treeData.forEach(tree => {
                if (tree.assignee_email) {
                    if (!assigneesMap!.has(tree.assignee_email)) {
                        assigneesMap!.set(tree.assignee_email, []);
                    }
                    assigneesMap!.get(tree.assignee_email)?.push(tree);
                }
            });

            const assigneeTemplateType: TemplateType = treeData.length > 1 ? 'receiver-multi-trees' : 'receiver-single-tree';
            const assigneeTemplates = await EmailTemplateRepository.getEmailTemplates({
                event_type,
                template_type: assigneeTemplateType
            });

            if (!assigneeTemplates?.length) {
                return res.status(404).json({ error: 'Assignee email template not found' });
            }

            // Send to each assignee
            for (const [assigneeEmail, assigneeTrees] of assigneesMap) {
                const assigneeEmailData = {
                    ...commonEmailData,
                    user_name: assigneeTrees[0].assignee_name,
                    assigned_to_name: assigneeTrees[0].assignee_name,
                    //assigned_to_name: assigneeTrees[0].assigned_to_name,
                    email: assigneeEmail,
                    trees: assigneeTrees,
                    count: assigneeTrees.length
                };

                const statusMessage = await sendDashboardMail(
                    assigneeTemplates[0].template_name,
                    assigneeEmailData,
                    test_mails || [assigneeEmail],
                    assignee_cc_mails || []
                );

                if (statusMessage) {
                    return res.status(500).json({ 
                        error: `Failed to send assignee email to ${assigneeEmail}: ${statusMessage}` 
                    });
                }
            }
        }

        return res.status(200).json({ 
            message: 'Emails processed successfully',
            details: {
                sponsor_sent: email_sponsor && sponsorEmailSuccess,
                recipient_sent: email_recipient && !!recipientsMap?.size,
                assignee_sent: email_assignee && !!assigneesMap?.size,
                recipient_count: email_recipient ? recipientsMap?.size || 0 : 0,
                assignee_count: email_assignee ? assigneesMap?.size || 0 : 0
            }
        });
    } catch (error) {
        console.error('Error sending donation emails:', error);
        console.error('Error stack:', (error as Error).stack);
        console.error('Error details:', JSON.stringify(error, Object.getOwnPropertyNames(error)));
        return res.status(500).json({ 
            error: 'Internal server error',
            details: {
                sponsor_sent: false,
                recipient_sent: false,
                assignee_sent: false
            }
        });
    }
};