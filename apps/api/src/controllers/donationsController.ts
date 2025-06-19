import { status } from "../helpers/status";
import { DonationRepository } from "../repo/donationsRepo";
import { getOffsetAndLimitFromRequest } from "./helper/request";
import { Request, Response } from "express";
import { FilterItem } from "../models/pagination";
import { DonationService } from "../facade/donationService";
import { UserRepository } from "../repo/userRepo";
import TreeRepository from "../repo/treeRepo"
import { DonationUserRepository } from "../repo/donationUsersRepo";
import { SortOrder } from "../models/common";
import { EmailTemplateRepository } from "../repo/emailTemplatesRepo";
import { sendDashboardMail } from "../services/gmail/gmail";
import { TemplateType } from "../models/email_template";
import { Donation, DonationMailStatus_DashboardsSent, DonationSponsorshipType, DonationSponsorshipType_DonationReceived, DonationSponsorshipType_Pledged, DonationSponsorshipType_Unverified, DonationStatus_OrderFulfilled, DonationStatus_UserSubmitted } from '../models/donation';
import { Op } from 'sequelize';
import RazorpayService from "../services/razorpay/razorpay";
import { PaymentRepository } from "../repo/paymentsRepo";
import PaymentService from "../facade/paymentService";
import { PaymentHistory } from "../models/payment_history";
import { GoogleSpreadsheet } from "../services/google";

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
        comments, users, donation_type, donation_method, visit_date, amount_donated,
        rfr, c_key
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

    // Validate tree plantation details
    if (!category)
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
        contribution_options: contribution_options || [],
        comments,
        donation_type,
        donation_method,
        visit_date,
        amount_donated,
        tags,
        rfr,
        c_key,
    }).catch((error) => {
        console.error("[ERROR] DonationsController::createDonation:", error);
        res.status(status.error).json({
            message: 'Failed to create donation'
        });
    })

    if (!donation) return;

    if (donation.payment_id) {
        const payment = await PaymentRepository.getPayment(donation.payment_id);
        if (payment && payment.order_id) {
            const razorpayService = new RazorpayService();
            await razorpayService.updateOrder(payment.order_id, { "Donation Id": donation.id.toString() })
        }
    }

    let usersCreated = true; // Default to true, only set to false if users array exists but creation fails
    if (users && users.length > 0) {
        await DonationService.createDonationUsers(
            donation.id,
            users
        ).catch((error) => {
            console.error("[ERROR] DonationsController::createDonation:", error);
            usersCreated = false;
        })
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

export const paymentSuccessForDonation = async (req: Request, res: Response) => {
    const { donation_id, is_corporate } = req.body;

    try {

        const donation = await DonationRepository.getDonation(donation_id);

        const usersResp = await UserRepository.getUsers(0, 1, [
            { columnField: 'id', operatorValue: 'equals', value: donation.user_id }
        ])
        const sponsorUser = usersResp.results[0];

        let transactionId = ""
        if (donation.payment_id) {
            let amountReceived: number = 0;
            let donationDate: Date | null = null;
            let sponsorshipType: DonationSponsorshipType = donation.trees_count ? DonationSponsorshipType_Pledged : DonationSponsorshipType_Unverified

            const payment: any = await PaymentRepository.getPayment(donation.payment_id);
            if (payment && payment.payment_history) {
                const paymentHistory: PaymentHistory[] = payment.payment_history;
                paymentHistory.forEach(payment => {
                    if (payment.status !== 'payment_not_received') amountReceived += payment.amount;
                })
            }

            if (payment?.order_id) {
                const razorpayService = new RazorpayService();

                const payments = await razorpayService.getPayments(payment.order_id);
                payments?.forEach(item => {
                    amountReceived += Number(item.amount) / 100;
                    if (item.status === 'captured') {
                        const data: any = item.acquirer_data;
                        if (data) {
                            const keys = Object.keys(data);
                            for (const key of keys) {
                                if (key.endsWith("transaction_id") && data[key]) {
                                    transactionId = data[key];
                                    break;
                                }
                            }
                        }
                    }
                })
            }

            if (amountReceived > 0) {
                donationDate = new Date();
            }

            if (amountReceived === donation.amount_donated)
                sponsorshipType = DonationSponsorshipType_DonationReceived;

            await DonationRepository.updateDonations({
                donation_date: donationDate,
                amount_received: amountReceived,
                sponsorship_type: sponsorshipType,
                updated_at: new Date()
            }, { id: donation.id })
        }

        res.status(status.success).send({});

        if (is_corporate) {
            await DonationService.reserveTreesForDonation(donation).catch(error => {
                console.error("[ERROR] DonationsController::paymentSuccessForDonation", error);
            });
            await DonationService.autoAssignTrees(donation.id).catch(error => {
                console.error("[ERROR] DonationsController::paymentSuccessForDonation", error);
            });
        }

        try {
            await DonationService.sendDonationAcknowledgement(donation, sponsorUser);
        } catch (error) {
            console.error("[ERROR] DonationsController::paymentSuccessForDonation:sendAcknowledgement", error);
        }

        if (transactionId) {
            const sheetName = "WebsiteTxns"
            const spreadsheetId = process.env.DONATION_SPREADSHEET;
            if (!spreadsheetId) {
                console.log("[WARN]", "DonationsController::paymentSuccessForDonation", "spreadsheet id (DONATION_SPREADSHEET) is not present in env");
                return;
            }

            const date = new Date();
            const FY = date.getMonth() < 3 ? date.getFullYear() : date.getFullYear() + 1;
            const receiptId = FY + "/" + donation.id.toString();

            const googleSheet = new GoogleSpreadsheet();
            await googleSheet.updateRowCellsByColumnValue(spreadsheetId, sheetName, "Rec", receiptId, {
                "Mode": transactionId
            }).catch(error => {
                console.error("[ERROR] Failed to update Google Sheet with transaction ID:", {
                    error,
                    stack: error instanceof Error ? error.stack : undefined
                });
            })
        }

        if (donation.rfr_id) {
            try {
                await DonationService.sendReferralDonationNotification(donation);
            } catch (referralError) {
                console.error("[ERROR] Failed to send referral notification:", referralError);
            }
        }

    } catch (error) {
        console.error("[ERROR] DonationsController::createDonation:sendAcknowledgement", error);
        res.status(status.error).send({ message: "Failed to send acknowledgment email!" });
    }
}

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

export const processDonation = async (req: Request, res: Response) => {
    const { id } = req.params;
    const { userId } = req.body;

    if (!userId) {
        return res.status(400).json({ message: 'User ID is required' });
    }

    try {
        // First check if donation exists and isn't processed
        const donation = await DonationRepository.getDonation(Number(id));

        if (donation.processed_by) {
            return res.status(409).json({
                message: 'Already processed by another user'
            });
        }

        // Use repository method to update
        const updated = await DonationRepository.updateDonations({
            processed_by: userId,
            updated_at: new Date()
        }, {
            id: donation.id,
            processed_by: { [Op.is]: null }
        });

        if (!updated) {
            return res.status(404).json({ message: 'Already being processed by another user' });
        }

        return res.status(200).json({ success: true });

    } catch (error: any) {
        console.error("Error processing donation:", error);
        if (error.message.includes('not found')) {
            return res.status(404).json({ message: 'Donation not found' });
        }
        return res.status(500).json({ message: 'Failed to process donation' });
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
        return res.status(status.bad).send({ message: "Donation Id required to reserve trees." })

    if (!auto_reserve && (!tree_ids || tree_ids.length === 0))
        return res.status(status.bad).send({ message: "Tree Ids not provided." })

    if (auto_reserve && (!plots || plots.length === 0))
        return res.status(status.bad).send({ message: "Please provided plots to reserve trees from." })

    try {
        if (auto_reserve) {
            await DonationService.autoReserveTrees(donation_id, plots, diversify, book_all_habits);
        } else {
            await DonationService.reserveSelectedTrees(donation_id, tree_ids);
        }

        const donation = await DonationRepository.getDonation(donation_id);
        res.status(status.success).send(donation);

        try {
            const userId = req.headers['x-user-id'] as string;
            if (!donation.processed_by && userId && !isNaN(parseInt(userId))) {
                await DonationRepository.updateDonation(donation.id, { processed_by: parseInt(userId) });
            }
        } catch (error: any) {
            console.log("[ERROR]", "donationsController::assignTrees", error);
        }
    } catch (error: any) {
        console.log("[ERROR]", "donationsController::reserveTreesForDonation", error);
        return res.status(status.error).send({
            message: error.message
        })
    }

}


export const unreserveTreesForDonation = async (req: Request, res: Response) => {
    const {
        donation_id, tree_ids,
        unreserve_all
    } = req.body;

    if (!donation_id)
        return res.status(status.bad).send({ message: "Donation Id required to reserve trees." })

    if (!unreserve_all && (!tree_ids || tree_ids.length === 0))
        return res.status(status.bad).send({ message: "Tree Ids not provided." })
    try {
        if (unreserve_all) {
            await DonationService.unreserveAllTrees(donation_id);
        } else {
            await DonationService.unreserveSelectedTrees(donation_id, tree_ids);
        }

        const donation = await DonationRepository.getDonation(donation_id);
        return res.status(status.success).send(donation);
    } catch (error: any) {
        console.log("[ERROR]", "donationsController::unreserveTreesForDonation", error);
        return res.status(status.error).send({
            message: error.message
        })
    }
}


export const mapAssignedTreesToDonation = async (req: Request, res: Response) => {
    const {
        donation_id, tree_ids
    } = req.body;

    if (!donation_id)
        return res.status(status.bad).send({ message: "Donation Id required to map trees to sponsor." })

    if (!tree_ids || tree_ids.length === 0)
        return res.status(status.bad).send({ message: "Tree Ids not provided." })

    try {
        const donation = await DonationRepository.getDonation(donation_id);

        // map assigned trees to donation
        await DonationService.mapTreesToDonation(donation, tree_ids);

        const updatedDonation = await DonationRepository.getDonation(donation_id);
        return res.status(status.success).send(updatedDonation);
    } catch (error: any) {
        console.log("[ERROR]", "donationsController::mapAssignedTreesToDonation", error);
        return res.status(status.error).send({
            message: error.message
        })
    }
}

export const unmapAssignedTreesFromDonation = async (req: Request, res: Response) => {
    const {
        donation_id, tree_ids
    } = req.body;

    if (!donation_id)
        return res.status(status.bad).send({ message: "Donation Id required to unmap trees from donation." })

    if (!tree_ids || tree_ids.length === 0)
        return res.status(status.bad).send({ message: "Tree Ids not provided." })

    try {
        const donation = await DonationRepository.getDonation(donation_id);

        // unmap trees from donation
        await DonationService.unmapTreesFromDonation(donation, tree_ids);

        const updatedDonation = await DonationRepository.getDonation(donation_id);
        return res.status(status.success).send(updatedDonation);
    } catch (error: any) {
        console.log("[ERROR]", "donationsController::unmapTreesFromDonation", error);
        return res.status(status.error).send({
            message: error.message
        })
    }
}

export const getMappedTreesByDonation = async (req: Request, res: Response) => {
    const { donation_id, offset = 0, limit = 20 } = req.body;

    if (!donation_id) {
        return res.status(status.bad).send({
            message: "Donation ID is required to fetch mapped trees.",
        });
    }

    try {
        const parsedOffset = parseInt(offset as string, 10) || 0;
        const parsedLimit = parseInt(limit as string, 10) || 20;

        const filters = req.body.filters || [];
        const orderBy = req.body.orderBy || [];

        const result = await DonationService.getMappedTrees(
            Number(donation_id),
            parsedOffset,
            parsedLimit,
            filters,
            orderBy
        );

        return res.status(status.success).send(result);
    } catch (error: any) {
        console.log("[ERROR]", "donationsController::getMappedTreesByDonation", error);
        return res.status(status.error).send({ message: error.message });
    }
};



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
        return res.status(status.bad).send({ message: "Donation Id required to reserve trees." })

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

        const updatedDonation = await DonationRepository.getDonation(donation_id);
        res.status(status.success).send(updatedDonation);

        try {
            const userId = req.headers['X-User-Id'] as string;
            if (!donation.processed_by && userId && !isNaN(parseInt(userId))) {
                await DonationRepository.updateDonation(donation.id, { processed_by: parseInt(userId) });
            }
        } catch (error: any) {
            console.log("[ERROR]", "donationsController::assignTrees", error);
        }

    } catch (error: any) {
        console.log("[ERROR]", "donationsController::assignTrees", error);
        return res.status(status.error).send({
            message: error.message
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
        return res.status(status.bad).send({ message: "Donation Id required to reserve trees." })

    if (!unassign_all && (!tree_ids || tree_ids.length === 0))
        return res.status(status.bad).send({ message: "Tree Ids not provided." })

    try {
        if (!unassign_all) {
            await DonationService.unassignTreesForDonationIdAndTreeIds(donation_id, tree_ids);
        } else {
            await DonationService.unassignTrees(donation_id);
        }

        const updatedDonation = await DonationRepository.getDonation(donation_id);
        return res.status(status.success).send(updatedDonation);
    } catch (error: any) {
        console.log("[ERROR]", "donationsController::unassignTrees", error);
        return res.status(status.error).send({
            message: error.message
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
    const { donation_id } = req.query;

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

        const { commonEmailData, treeData } = await DonationService.getEmailDataForDonation(donation, event_type);
        if (treeData.length === 0) {
            return res.status(400).json({ error: 'No trees found for this donation' });
        }

        res.status(200).json();

        // Send email to sponsor if enabled
        if (!donation.mail_status?.includes(DonationMailStatus_DashboardsSent) && email_sponsor) {
            await DonationService.sendDashboardEmailToSponsor(donation, commonEmailData, treeData, event_type, test_mails, sponsor_cc_mails);
        }

        // Send email to recipient if enabled
        if (email_recipient) {
            await DonationService.sendDashboardEmailsToRecipients(donation, commonEmailData, treeData, event_type, test_mails, recipient_cc_mails);
        }

        // Send email to assignee if enabled
        if (email_assignee) {
            await DonationService.sendDashboardEmailsToAssignees(donation, commonEmailData, treeData, event_type, test_mails, assignee_cc_mails);
        }
    } catch (error) {
        console.error('Error sending donation emails:', error);
        console.error('Error stack:', (error as Error).stack);
    }
};

/**
 * Create Donations V2
 */
export const createDonationV2 = async (req: Request, res: Response) => {
    const {
        group_id,
        sponsor_name,
        sponsor_email,
        sponsor_phone,
        trees_count,
        amount_donated,
        tags,
        users,
    } = req.body;

    // Validate required fields
    if (!sponsor_name || !sponsor_email) {
        return res.status(status.bad).json({
            message: 'Invalid sponsor name or email. Please provide valid details!'
        });
    }

    // Validate donation type specific fields
    if (!trees_count) {
        return res.status(status.bad).json({
            message: 'Tree count is required for tree donations'
        });
    }

    try {
        // Create payment if needed
        let payment = null;
        if (amount_donated && amount_donated > 0) {
            payment = await PaymentService.createPayment(
                amount_donated,
                "Indian Citizen",
                undefined,
                true
            );
        }

        // Create donation
        const donation = await DonationService.createDonation({
            sponsor_name,
            sponsor_email,
            sponsor_phone,
            trees_count: trees_count || 0,
            pledged_area_acres: 0, // Default to 0 if not provided
            payment_id: payment ? payment.id : null,
            category: 'Foundation',
            grove: "",
            contribution_options: [],
            comments: null,
            donation_type: "donate",
            donation_method: "trees",
            visit_date: null,
            amount_donated,
            tags,
            group_id: group_id || null
        }).catch((error) => {
            console.error("[ERROR] DonationsController::createDonationV2:createDonation", error);
            return null;
        });

        if (!donation) {
            return res.status(status.error).json({
                message: 'Failed to create donation'
            });
        }

        // Update Razorpay order if payment exists
        if (donation.payment_id) {
            const paymentRecord = await PaymentRepository.getPayment(donation.payment_id);
            if (paymentRecord && paymentRecord.order_id) {
                const razorpayService = new RazorpayService();
                await razorpayService.updateOrder(paymentRecord.order_id, { "Donation Id": donation.id.toString() });
            }
        }

        // Create donation users if provided
        let usersCreated = true;
        if (users && Array.isArray(users) && users.length > 0) {
            await DonationService.createDonationUsers(
                donation.id,
                users
            ).catch((error) => {
                console.error("[ERROR] DonationsController::createDonationV2:createDonationUsers", error);
                usersCreated = false;
            });
        }

        // Return the created donation with payment order ID if available
        const responseData = {
            donation,
            order_id: payment ? payment.order_id : null
        };

        return res.status(status.created).send(responseData);
    } catch (error: any) {
        console.error("[ERROR] DonationsController::createDonationV2", error);
        return res.status(status.error).json({
            message: error.message || 'Something went wrong. Please try again later.'
        });
    }
};

export const bulkAssignTrees = async (req: Request, res: Response) => {
    const { group_id, users } = req.body;

    if (!group_id || !Array.isArray(users) || users.length === 0) {
        return res.status(status.bad).json({ message: 'Group ID and non-empty users array are required' });
    }

    try {
        const donationResponse = await DonationRepository.getDonations(
            0, -1,
            [{ columnField: 'group_id', operatorValue: 'equals', value: group_id }]
        );

        let idx = 0;
        for (const donation of donationResponse.results) {
            if (!donation.trees_count || (donation as any).booked == (donation as any).assigned)
                continue; // Skip donations that are already fully assigned or have no trees

            let cnt = Number((donation as any).booked) - Number((donation as any).assigned);
            const partUsers: any[] = [];
            for (; idx < users.length && cnt > 0; idx++) {
                if (users[idx].trees_count <= cnt) {
                    partUsers.push(users[idx])
                    cnt -= users[idx].trees_count;
                } else if (cnt > 0) {
                    partUsers.push({
                        ...users[idx],
                        trees_count: cnt
                    });
                    users[idx].trees_count -= cnt;
                    idx--; // Adjust index since we modified the current user
                    cnt = 0;
                }
            }

            if (partUsers.length > 0) {
                // Create donation users for this part
                await DonationService.createDonationUsers(donation.id, partUsers);
                // Assign trees to these users
                await DonationService.autoAssignTrees(donation.id);
            }
            if (idx >= users.length) break; // Stop if we've processed all users
        }

        return res.status(status.success).send();

    } catch (error: any) {
        console.error("[ERROR] DonationsController::bulkAssignTrees", error);
        return res.status(status.error).json({
            message: error.message || 'Something went wrong during tree assignment'
        });
    }
};

/**
 * Auto process donation request
 */
export const autoProcessDonationRequest = async (req: Request, res: Response) => {

    const {
        donation_id
    } = req.body;

    if (!donation_id)
        return res.status(status.bad).send({ message: "Donation Id required to process request." })

    try {
        const donation = await DonationRepository.getDonation(donation_id);

        await DonationService.reserveTreesForDonation(donation);
        await DonationService.assignTreesForDonation(donation);

        const updatedDonation = await DonationRepository.getDonation(donation_id);
        const { commonEmailData, treeData } = await DonationService.getEmailDataForDonation(updatedDonation, 'default');

        res.status(status.success).send(updatedDonation);

        try {
            const userId = req.headers['x-user-id'] as string;
            if (!donation.processed_by && userId && !isNaN(parseInt(userId))) {
                await DonationRepository.updateDonation(donation.id, { processed_by: parseInt(userId) });
            }
        } catch (error: any) {
            console.log("[ERROR]", "donationsController::autoProcessDonationRequest", error);
        }

        if (treeData.length > 0) {
            try {
                await DonationService.sendDashboardEmailToSponsor(updatedDonation, commonEmailData, treeData, 'default');
                await DonationService.sendDashboardEmailsToRecipients(updatedDonation, commonEmailData, treeData, 'default');
            } catch (error) {
                console.log("[ERROR]", "donationsController::autoProcessDonationRequest", error);
            }
        }
    } catch (error: any) {
        console.log("[ERROR]", "donationsController::autoProcessDonationRequest", error);
        return res.status(status.error).send({
            message: error.message
        })
    }
}


export const getTreesCountForAutoReserveTrees = async (req: Request, res: Response) => {
    const {
        donation_id
    } = req.body;

    if (!donation_id)
        return res.status(status.bad).send({ message: "Donation Id required to process request." })

    try {
        const donation = await DonationRepository.getDonation(donation_id);

        const data = await DonationService.getPlotTreesCntForAutoReserveTreesForDonation(donation);

        return res.status(status.success).send(data);
    } catch (error: any) {
        console.log("[ERROR]", "donationsController::getTreesCountForAutoReserveTrees", error);
        return res.status(status.error).send({
            message: error.message
        })
    }
}