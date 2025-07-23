import { Request, Response } from "express";
import { CampaignsRepository } from "../repo/campaignsRepo";
import { UserRepository } from "../repo/userRepo";
import { ReferralsRepository } from "../repo/referralsRepo";
import { sendDashboardMail } from "../services/gmail/gmail";
import { Op } from "sequelize";


export const createReferral = async (req: Request, res: Response) => {

    try {
        const { email, c_key } = req.body;
        if (!email) {
            return res.status(400).json({ message: "User email required to generate referral link!" });
        }

        let cKey: string | null = null;
        if (c_key) {
            const campaignsResp = await CampaignsRepository.getCampaigns(0, 1, [{ columnField: 'c_key', value: c_key, operatorValue: 'equals' }]);
            if (campaignsResp.results.length !== 0) {
                cKey = campaignsResp.results[0].c_key;
            }
        }

        const usersResp = await UserRepository.getUsers(0, 1, [{ columnField: 'email', value: email, operatorValue: 'equals' }]);
        if (usersResp.results.length === 0) {
            return res.status(404).json({ message: "User not registed in the system!" });
        }

        const user = usersResp.results[0];
        let rfr: string | null = user.rfr;
        if (!user.rfr) {
            rfr = user.name.split(' ')[0].toLowerCase() + '-' + Math.random().toString(36).substring(2, 5);
            await UserRepository.updateUsers({ rfr: rfr }, { id: user.id });
        }

        const referrals = await ReferralsRepository.getReferrals({ rfr: rfr, c_key: cKey });
        if (referrals.length > 0) {
            return res.status(201).json({ rfr: referrals[0].rfr, c_key: referrals[0].c_key });
        }

        const referral = await ReferralsRepository.createReferece(rfr, cKey);

        // Send email with referral links after successful creation
        if (referral.rfr && user.email) {
            try {
                const baseUrl = process.env.FRONTEND_URL;
                const referralData = {
                    rfr: referral.rfr,
                    c_key: referral.c_key
                };

                const buildReferralLink = (linkType: string) => {
                    let link = `${baseUrl}/${linkType}`;
                    const params = new URLSearchParams();

                    if (referralData.rfr) {
                        params.append('r', referralData.rfr);
                    }

                    if (referralData.c_key) {
                        params.append('c', referralData.c_key);
                    }

                    return params.toString() ? `${link}?${params.toString()}` : link;
                };

                const emailData = {
                    name: user.name,
                    donate_link: buildReferralLink('donate'),
                    gift_link: buildReferralLink('plant-memory'),
                    current_year: new Date().getFullYear(),
                };

                await sendDashboardMail(
                    'referrer_email.html',
                    emailData,
                    [user.email],
                    undefined,
                    undefined,
                    'Your 14Trees Referral Links Are Ready!'
                );

                console.log("[INFO] Referral links email sent to", user.email);
            } catch (emailError) {
                console.error("[ERROR] Failed to send referral links email:", emailError);
            }
        }

        return res.status(201).json({ rfr: referral.rfr, c_key: referral.c_key });
    } catch (error: any) {
        console.error("[ERROR] ReferralController::createReferral", error);
        res.status(500).json({
            message: 'Failed to create referral',
            error: error.message || 'Internal Server Error'
        });
    }
}


export const getReferralDetails = async (req: Request, res: Response) => {
    try {
        const { rfr, c_key } = req.body;

        if (!rfr && !c_key) {
            return res.status(400).json({ message: "Referral code or campaign key is required!" });
        }

        let referredBy: string | undefined = undefined;
        if (rfr) {
            const usersResp = await UserRepository.getUsers(0, 1, [{ columnField: 'rfr', value: rfr, operatorValue: 'equals' }]);
            if (usersResp.results.length !== 0) {
                referredBy = usersResp.results[0].name;
            }
        }

        let name: string | undefined = undefined;
        let cKey: string | undefined = undefined;
        let description: string | undefined = undefined;
        if (c_key) {
            const campaignsResp = await CampaignsRepository.getCampaigns(0, 1, [{ columnField: 'c_key', value: c_key, operatorValue: 'equals' }]);
            if (campaignsResp.results.length !== 0) {
                name = campaignsResp.results[0].name;
                cKey = campaignsResp.results[0].c_key;
                description = campaignsResp.results[0].description ?? undefined;
            }
        }

        return res.status(200).json({
            rfr: rfr,
            c_key: cKey,
            referred_by: referredBy,
            name: name,
            description: description
        });

    } catch (error: any) {
        console.error("[ERROR] ReferralController::getReferralDetails", error);
        res.status(500).json({
            message: 'Failed to get referral details',
            error: error.message || 'Internal Server Error'
        });
    }
}

export const getUserNameByReferral = async (req: Request, res: Response) => {
    try {
        const { rfr } = req.body;
        
        if (!rfr) {
            return res.status(400).json({ message: "Referral code (rfr) is required!" });
        }

        const usersResp = await UserRepository.getUsers(0, 1, [
            { columnField: 'rfr', value: rfr, operatorValue: 'equals' }
        ]);

        if (usersResp.results.length === 0) {
            return res.status(404).json({ message: "No user found with this referral code" });
        }

        const user = usersResp.results[0];
        return res.status(200).json({ name: user.name });

    } catch (error: any) {
        console.error("[ERROR] ReferralController::getUserNameByReferral", error);
        res.status(500).json({
            message: 'Failed to fetch user name by referral',
            error: error.message || 'Internal Server Error'
        });
    }
}