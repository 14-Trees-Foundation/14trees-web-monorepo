import { WhereOptions } from "sequelize";
import { Campaign, CampaignAttributes } from "../models/campaign";

export class CampaignsRepository {

    public static async getCampaigns(whereClause: WhereOptions<CampaignAttributes>): Promise<Campaign[]> {
        const campaigns = await Campaign.findAll({
            where: whereClause,
        });

        return campaigns;
    }

    public static async createCampaign(name: string, c_key: string, description?: string): Promise<Campaign> {
        const campaign = await Campaign.create({
            name,
            c_key,
            description: description || null,
        });

        return campaign;
    }

}