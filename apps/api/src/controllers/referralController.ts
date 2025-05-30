import { Request, Response } from "express";
import { CampaignsRepository } from "../repo/campaignsRepo";
import { UserRepository } from "../repo/userRepo";
import { ReferralsRepository } from "../repo/referralsRepo";


export const createReferral = async (req: Request, res: Response) => {

    try {
        const { email, c_key } = req.body;
        if (!email) {
            return res.status(400).json({ message: "User email required to generate referral link!" });
        }

        let cKey: string | null = null;
        if (c_key) {
            const campaigns = await CampaignsRepository.getCampaigns({ c_key: c_key });
            if (campaigns.length !== 0) {
                cKey = campaigns[0].c_key;
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

        return res.status(201).json({ rfr: referral.rfr, c_key: referral.c_key });
    } catch (error: any) {
        console.error("[ERROR] ReferralController::createReferral", error);
        res.status(500).json({
            message: 'Failed to create referral',
            error: error.message || 'Internal Server Error'
        });
    }
}