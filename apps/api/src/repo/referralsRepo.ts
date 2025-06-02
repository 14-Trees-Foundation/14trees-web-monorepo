import { WhereOptions } from "sequelize";
import { Referral, ReferralAttributes } from "../models/referral";

export class ReferralsRepository {

    public static async getReferrals(whereClause: WhereOptions<ReferralAttributes>): Promise<Referral[]> {
        const referrals = await Referral.findAll({
            where: whereClause,
        });

        return referrals;
    }

    public static async createReferece(rfr: string | null, c_key: string | null): Promise<Referral> {
        const referral = await Referral.create({
            rfr,
            c_key,
        });

        return referral;
    }

}