import { LandCategory } from "../models/common";
import { ContributionOption, Donation, DonationCreationAttributes } from "../models/donation";
import { UserRepository } from "../repo/userRepo";
import { DonationRepository } from "../repo/donationsRepo";
import { DonationUserCreationAttributes } from "../models/donation_user";
import { DonationUserRepository } from "../repo/donationUsersRepo";
import { User } from "../models/user";
import { sendDashboardMail } from '../services/gmail/gmail';

interface DonationUserRequest {
    name: string
    email: string | null,
    phone: string | null,
    trees_count: number
}

interface CreateDonationRequest {
    sponsor_name: string;
    sponsor_email: string;
    sponsor_phone?: string | null;
    payment_id: number | null;
    category: LandCategory;
    grove: string;
    trees_count: number,
    continution_options: ContributionOption,
}

export class DonationService {

    public static async createDonation(data: CreateDonationRequest): Promise<Donation> {
        const {
            sponsor_name, sponsor_email, sponsor_phone, grove,
            trees_count, category, payment_id, continution_options,
        } = data;

        const sponsorUser = await UserRepository.upsertUser({
            name: sponsor_name,
            email: sponsor_email,
            phone: sponsor_phone
        }).catch((error: any) => {
            console.error("DonationService::createDonation", error)
            throw new Error("Failed to save sponsor details in the system!")
        })

        const request: DonationCreationAttributes = {
            user_id: sponsorUser.id,
            trees_count: trees_count,
            category: category,
            grove: grove,
            payment_id: payment_id,
            created_by: sponsorUser.id, // For now setting created by = sponsor
            contribution_options: continution_options,
        }

        const donation = await DonationRepository.createdDonation(
            request
        ).catch((error: any) => {
            console.error("DonationService::createDonation", error)
            throw new Error("Failed to save your donation request!")
        })
        
        return donation;
    }

    public static async createDonationUsers(donationId: number, usersData: DonationUserRequest[]) {

        const userRequests: DonationUserCreationAttributes[] = [];

        for (const userData of usersData) {
            const user = await UserRepository.upsertUser(userData)
            userRequests.push({
                recipient: user.id,
                assignee: user.id,
                trees_count: userData.trees_count,
                donation_id: donationId
            })
        }

        await DonationUserRepository.createDonationUsers(userRequests);
    }
    public static async sendDonationAcknowledgement(
        donation: Donation,
        sponsorUser: User,
        testMails?: string[],
        ccMails?: string[]
    ): Promise<void> {
        try {
            const emailData = {
                user_name: sponsorUser.name,
                user_email: sponsorUser.email,
                donation_id: donation.id,
                category: donation.category,
                grove: donation.grove,
                grove_type_other: donation.grove_type_other,
                trees_count: donation.trees_count,
                contribution_options: donation.contribution_options,
                names_for_plantation: donation.names_for_plantation,
                comments: donation.comments,
                created_at: new Date(donation.created_at).toLocaleDateString(),
            };
    
            const ccMailIds = (ccMails && ccMails.length !== 0) ? ccMails : undefined;
            const mailIds = (testMails && testMails.length !== 0) ? 
                testMails : 
                [sponsorUser.email];
    
            // Use template directly instead of querying from repository
            const templateName = 'donor-sum.html';
            
            const statusMessage = await sendDashboardMail(
                templateName,
                emailData,
                mailIds,
                ccMailIds,
                [], // no attachments
                'Donation Request Received'
            );
    
            if (statusMessage) {
                console.error("[ERROR] DonationService::sendDonationAcknowledgement", statusMessage);
            }
    
        } catch (error) {
            console.error("[ERROR] DonationService::sendDonationAcknowledgement", error);
            throw new Error("Failed to send acknowledgement email");
        }
    }
}