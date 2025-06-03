import { WhereOptions, QueryTypes } from "sequelize";
import { sequelize } from '../config/postgreDB';
import { Campaign, CampaignAttributes } from "../models/campaign";
import { FilterItem, PaginatedResponse } from "../models/pagination";
import { SortOrder } from "../models/common";
import { getSqlQueryExpression } from "../controllers/helper/filters";

interface CampaignSummaryResult {
    donationCount: number;
    giftRequestCount: number;
    totalAmount: number;
    treesCount: number;
}

interface CampaignChampionResult {
    name: string;
    email: string;
    referralDonationsCount: number;
    amountRaised: number;
    treesSponsored: number;
}

interface ReferralCountsResult {
    personalReferrals: number;
    campaignReferrals: number;
    totalReferrals: number;
}

interface ReferralDonation {
    donorName: string;
    donationMethod: string;
    treesCount: number;
    amount: number;
}

interface ReferralGift {
    giftedByName: string;
    treesCount: number;
    amount: number;
}

interface ReferralDashboardResult {
    totalRaised: number;
    totalTrees: number;
    donations: ReferralDonation[];
    gifts: ReferralGift[];
}

export class CampaignsRepository {

    public static async getCampaigns(offset: number, limit: number, filters?: FilterItem[], orderBy?: SortOrder[]): Promise<PaginatedResponse<Campaign>> {
        try {
            let whereConditions: string = "";
            let replacements: any = {};

            // Build WHERE conditions from filters
            if (filters && filters.length > 0) {
                filters.forEach(filter => {
                    const { condition, replacement } = getSqlQueryExpression(
                        `c.${filter.columnField}`,
                        filter.operatorValue,
                        filter.columnField,
                        filter.value
                    );
                    whereConditions = whereConditions + " " + condition + " AND";
                    replacements = { ...replacements, ...replacement };
                });
                whereConditions = whereConditions.substring(0, whereConditions.length - 3);
            }

            // Build ORDER BY clause
            const sortOrderQuery = orderBy && orderBy.length > 0
                ? orderBy.map(order => `c.${order.column} ${order.order}`).join(', ')
                : 'c.id DESC';

            // Main query to get paginated results
            const getQuery = `
                SELECT c.*
                FROM "14trees".campaigns c
                WHERE ${whereConditions !== "" ? whereConditions : "1=1"}
                ORDER BY ${sortOrderQuery}
                ${limit === -1 ? "" : `LIMIT ${limit} OFFSET ${offset}`};
            `;

            // Count query for pagination
            const countQuery = `
                SELECT COUNT(*) 
                FROM "14trees".campaigns c
                WHERE ${whereConditions !== "" ? whereConditions : "1=1"};
            `;

            // Execute both queries in parallel
            const [campaigns, campaignsCount] = await Promise.all([
                sequelize.query(getQuery, {
                    replacements: replacements,
                    type: QueryTypes.SELECT,
                }),
                sequelize.query(countQuery, {
                    replacements: replacements,
                    type: QueryTypes.SELECT
                })
            ]);

            return {
                offset: offset,
                total: parseInt((campaignsCount[0] as any).count),
                results: campaigns as Campaign[]
            };
        } catch (error) {
            console.error('[ERROR] CampaignsRepository::getCampaigns:', error);
            throw new Error('Failed to fetch campaigns');
        }
    }

    public static async updateCampaign(campaignId: number, updateData: Partial<CampaignAttributes>): Promise<Campaign> {
        const [numRowsUpdated, updatedCampaigns] = await Campaign.update(updateData, {
            where: { id: campaignId },
            returning: true, // Returns the updated record(s)
        });

        if (numRowsUpdated === 0) {
            throw new Error('Campaign not found or no changes made');
        }

        return updatedCampaigns[0];
    }

    public static async createCampaign(name: string, c_key: string, description?: string): Promise<Campaign> {
        const campaign = await Campaign.create({
            name,
            c_key,
            description: description || null,
        });

        return campaign;
    }

    public static async getCampaignSummary(c_key: string): Promise<CampaignSummaryResult> {
        const query = `
            WITH valid_gift_cards AS (
                SELECT 
                    rfr_id,
                    COUNT(*) as count,
                    SUM(
                        CASE 
                            WHEN category = 'Public' THEN 2000
                            WHEN category = 'Foundation' THEN 3000
                            ELSE 0
                        END
                    ) as amount,
                    SUM(no_of_cards) as trees
                FROM "14trees".gift_card_requests
                WHERE request_type = 'Gift Cards'
                GROUP BY rfr_id
            )
            SELECT
                COUNT(DISTINCT d.id) as "donationCount",
                COALESCE(SUM(vgc.count), 0) as "giftRequestCount",
                COALESCE(SUM(d.amount_donated), 0) + COALESCE(SUM(vgc.amount), 0) as "totalAmount",
                COALESCE(SUM(d.trees_count), 0) + COALESCE(SUM(vgc.trees), 0) as "treesCount"
            FROM "14trees".referrals r
            LEFT JOIN "14trees".donations d ON r.id = d.rfr_id
            LEFT JOIN valid_gift_cards vgc ON r.id = vgc.rfr_id
            WHERE r.c_key = :c_key
        `;

        const [result] = await sequelize.query<CampaignSummaryResult>(query, {
            replacements: { c_key },
            type: QueryTypes.SELECT
        });

        return result;
    }

    public static async getCampaignChampion(c_key: string): Promise<CampaignChampionResult[] | null> {
        const query = `
            WITH valid_gift_cards AS (
                SELECT 
                    rfr_id,
                    SUM(CASE 
                        WHEN category = 'Public' THEN 2000
                        WHEN category = 'Foundation' THEN 3000
                        ELSE 0
                    END) as gift_card_amount,
                    COUNT(*) as gift_card_count,
                    SUM(no_of_cards) as gift_card_trees
                FROM "14trees".gift_card_requests
                WHERE request_type = 'Gift Cards'
                GROUP BY rfr_id
            ),
            donation_gift_summary AS (
                SELECT
                    r.id as referral_id,
                    r.rfr as rfr_code,
                    COALESCE(SUM(d.amount_donated), 0) as donation_amount,
                    COALESCE(SUM(d.trees_count), 0) as donation_trees,
                    COALESCE(vgc.gift_card_amount, 0) as gift_card_amount,
                    COALESCE(vgc.gift_card_count, 0) as gift_card_count,
                    COALESCE(vgc.gift_card_trees, 0) as gift_card_trees,
                    COALESCE(SUM(d.amount_donated), 0) + COALESCE(vgc.gift_card_amount, 0) as total_amount
                FROM "14trees".referrals r
                LEFT JOIN "14trees".donations d ON r.id = d.rfr_id
                LEFT JOIN valid_gift_cards vgc ON r.id = vgc.rfr_id
                WHERE r.c_key = :c_key
                GROUP BY r.id, r.rfr, vgc.gift_card_amount, vgc.gift_card_count, vgc.gift_card_trees
            )
            SELECT 
                u.name,
                u.email,
                dgs.referral_id,
                dgs.rfr_code,
                (dgs.donation_amount + dgs.gift_card_amount) as "amountRaised",
                (dgs.donation_trees + dgs.gift_card_trees) as "treesSponsored",
                (dgs.gift_card_count + 0) as "referralDonationsCount"
            FROM donation_gift_summary dgs
            LEFT JOIN "14trees".users u ON u.rfr = dgs.rfr_code
            ORDER BY (dgs.donation_amount + dgs.gift_card_amount) DESC
        `;

        const results = await sequelize.query<CampaignChampionResult>(query, {
            replacements: { c_key },
            type: QueryTypes.SELECT
        });

        return results.length > 0 ? results : null;
    }

    public static async getReferralCounts(): Promise<ReferralCountsResult> {
        const query = `
            SELECT
                COUNT(*) FILTER (WHERE c_key IS NULL) AS "personalReferrals",
                COUNT(*) FILTER (WHERE c_key IS NOT NULL) AS "campaignReferrals",
                COUNT(*) AS "totalReferrals"
            FROM "14trees".referrals
        `;

        const [result] = await sequelize.query<ReferralCountsResult>(query, {
            type: QueryTypes.SELECT
        });

        return result;
    }

    public static async getReferralDashboard(rfr: string): Promise<ReferralDashboardResult> {
        const query = `
            WITH referral_cte AS (
                SELECT id FROM "14trees".referrals WHERE rfr = :rfr
            ),
            donation_data AS (
                SELECT 
                    u.name as "donorName",
                    u.email as "donorEmail",
                    d.donation_method as "donationMethod",
                    CASE 
                        WHEN d.donation_method = 'trees' THEN 'Planted Trees'
                        WHEN d.donation_method IS NULL THEN 'Adopted Trees'
                        WHEN d.donation_method = 'amount' THEN 'General Donation'
                        ELSE 'Other'
                    END as "donationTypeLabel",
                    NULLIF(d.trees_count, 0) as "treesCount",
                    NULLIF(d.amount_donated, 0) as "amount"
                FROM "14trees".donations d
                JOIN referral_cte r ON d.rfr_id = r.id
                LEFT JOIN "14trees".users u ON u.id = d.user_id
            ),
            gift_data AS (
                SELECT 
                    u.name as "giftedByName",
                    u.email as "giftedByEmail",
                    g.no_of_cards as "treesCount",
                    CASE 
                        WHEN g.category = 'Public' THEN 2000 * g.no_of_cards
                        WHEN g.category = 'Foundation' THEN 3000 * g.no_of_cards
                        ELSE NULL
                    END as "amount"
                FROM "14trees".gift_card_requests g
                JOIN referral_cte r ON g.rfr_id = r.id
                LEFT JOIN "14trees".users u ON u.id = g.user_id
                WHERE g.request_type = 'Gift Cards'
            )
            SELECT
                (SELECT COALESCE(SUM(amount), 0) FROM donation_data) + 
                (SELECT COALESCE(SUM(amount), 0) FROM gift_data) as "totalRaised",
                (SELECT COALESCE(SUM("treesCount"), 0) FROM donation_data) + 
                (SELECT COALESCE(SUM("treesCount"), 0) FROM gift_data) as "totalTrees",
                (SELECT COALESCE(JSON_AGG(donation_data), '[]') FROM donation_data) as "donations",
                (SELECT COALESCE(JSON_AGG(gift_data), '[]') FROM gift_data) as "gifts"
        `;

        const [result] = await sequelize.query<ReferralDashboardResult>(query, {
            replacements: { rfr },
            type: QueryTypes.SELECT
        });

        return {
            totalRaised: result?.totalRaised || 0,
            totalTrees: result?.totalTrees || 0,
            donations: result?.donations || [],
            gifts: result?.gifts || []
        };
    }

}