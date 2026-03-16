import { Op, QueryTypes, WhereOptions } from "sequelize";
import { GiftCardRequest, GiftCardRequestAttributes, GiftCardRequestCreationAttributes } from "../models/gift_card_request";
import { FilterItem, PaginatedResponse } from "../models/pagination";
import { getSqlQueryExpression } from "../controllers/helper/filters";
import { sequelize } from "../config/postgreDB";
import { GiftCard, GiftCardAttributes, GiftCardCreationAttributes } from "../models/gift_card";
import { GiftCardPlot, GiftCardPlotCreationAttributes } from "../models/gift_card_plot";
import { GiftCardUserTemplate, GiftCardUserTemplateCreationAttributes } from "../models/gift_card_user_template";
import { PlantTypeCardTemplate } from "../models/plant_type_card_template";
import { GiftRequestUser, GiftRequestUserAttributes, GiftRequestUserCreationAttributes } from "../models/gift_request_user";
import { getSchema } from '../helpers/utils';

export class GiftCardsRepository {

    public static async getGiftRequestTags(offset: number, limit: number): Promise<PaginatedResponse<string>> {
        const tags: string[] = [];

        const getUniqueTagsQuery =
            `SELECT DISTINCT tag
                FROM "${getSchema()}".gift_card_requests gcr,
                unnest(gcr.tags) AS tag
                ORDER BY tag
                OFFSET ${offset} LIMIT ${limit};`;

        const countUniqueTagsQuery =
            `SELECT count(DISTINCT tag)
                FROM "${getSchema()}".gift_card_requests gcr,
                unnest(gcr.tags) AS tag;`;

        const tagsResp: any[] = await sequelize.query(getUniqueTagsQuery, { type: QueryTypes.SELECT });
        tagsResp.forEach(r => tags.push(r.tag));

        const countResp: any[] = await sequelize.query(countUniqueTagsQuery, { type: QueryTypes.SELECT });
        const total = parseInt(countResp[0].count);
        return { offset: offset, total: total, results: tags };
    }

    static async getGiftCardRequests(
        offset: number,
        limit: number,
        filters?: FilterItem[],
        orderBy?: { column: string, order: "ASC" | "DESC" }[]
    ): Promise<PaginatedResponse<GiftCardRequest>> {
        let whereConditions: string = "";
        let replacements: any = {}

        if (filters && filters.length > 0) {
            filters.forEach(filter => {
                let columnField = "gcr." + filter.columnField;
                if (filter.columnField === "user_name") {
                    columnField = "u.name";
                } else if (filter.columnField === "group_name") {
                    columnField = "g.name";
                } else if (filter.columnField === "created_by_name") {
                    columnField = "cu.name";
                } else if (filter.columnField === "processed_by_name") {  // NEW: Filter by processor name
                    columnField = "pu.name";
                } else if (filter.columnField === "recipient_name") {
                    columnField = "ru.name";
                }
                const { condition, replacement } = getSqlQueryExpression(columnField, filter.operatorValue, filter.columnField, filter.value);
                whereConditions = whereConditions + " " + condition + " AND";
                replacements = { ...replacements, ...replacement };
            });
            whereConditions = whereConditions.substring(0, whereConditions.length - 3);
        }

        const getQuery = `
            SELECT gcr.*,
                u.name as user_name,
                u.email as user_email,
                u.phone as user_phone,
                g.name as group_name,
                g.logo_url as group_logo_url,
                cu.name as created_by_name,
                pu.name as processed_by_name,
                MIN(ru.name) AS recipient_name,
                SUM(CASE 
                    WHEN gc.tree_id is not null
                    THEN 1
                    ELSE 0
                END) AS booked,
                SUM(CASE 
                    WHEN gru.id is not null and gru.mail_sent = true
                    THEN 1
                    ELSE 0
                END) AS mailed_count,
                SUM(CASE 
                    WHEN gru.mail_sent_assignee = true
                    THEN 1
                    ELSE 0
                END) AS mailed_assignee_count,
                COUNT(distinct gru.id) as users_count,
                SUM(CASE 
                    WHEN t.assigned_to is not null
                    THEN 1
                    ELSE 0
                END) AS assigned,
                CASE
                    WHEN gcr.category = 'Public'
                    THEN (
                        CASE 
                            WHEN gcr.request_type = 'Normal Assignment' OR gcr.request_type = 'Visit'
                            THEN 1500
                            ELSE 2000
                        END
                    )
                    ELSE 3000
                END * gcr.no_of_cards AS total_amount,
                array_agg(distinct gc.presentation_id) as presentation_ids
            FROM "${getSchema()}".gift_card_requests gcr
            LEFT JOIN "${getSchema()}".users u ON u.id = gcr.user_id
            LEFT JOIN "${getSchema()}".users cu ON cu.id = gcr.created_by
            LEFT JOIN "${getSchema()}".users pu ON pu.id = gcr.processed_by
            LEFT JOIN "${getSchema()}".groups g ON g.id = gcr.group_id
            LEFT JOIN "${getSchema()}".gift_cards gc ON gc.gift_card_request_id = gcr.id
            LEFT JOIN "${getSchema()}".trees t ON t.id = gc.tree_id
            LEFT JOIN "${getSchema()}".gift_request_users gru ON gru.id = gc.gift_request_user_id
            LEFT JOIN "${getSchema()}".users ru ON ru.id = gru.recipient
            WHERE ${whereConditions || "1=1"}
            GROUP BY gcr.id, u.id, cu.id, pu.id, g.name, g.logo_url
            ORDER BY ${orderBy?.map(o => `gcr.${o.column} ${o.order}`).join(", ") || 'gcr.id DESC'}
            ${limit === -1 ? "" : `LIMIT ${limit} OFFSET ${offset}`};
        `;

        const countQuery = `
            SELECT COUNT(DISTINCT gcr.id)  
            FROM "${getSchema()}".gift_card_requests gcr
            LEFT JOIN "${getSchema()}".users u ON u.id = gcr.user_id
            LEFT JOIN "${getSchema()}".users cu ON cu.id = gcr.created_by
            LEFT JOIN "${getSchema()}".users pu ON pu.id = gcr.processed_by  
            LEFT JOIN "${getSchema()}".groups g ON g.id = gcr.group_id
            LEFT JOIN "${getSchema()}".gift_cards gc ON gc.gift_card_request_id = gcr.id
            LEFT JOIN "${getSchema()}".gift_request_users gru ON gru.id = gc.gift_request_user_id
            LEFT JOIN "${getSchema()}".users ru ON ru.id = gru.recipient
            WHERE ${whereConditions || "1=1"};
        `;

        const giftCards: any[] = await sequelize.query(getQuery, {
            replacements: replacements,
            type: QueryTypes.SELECT
        })

        const countGiftCards: any = await sequelize.query(countQuery, {
            replacements: replacements,
            type: QueryTypes.SELECT
        })
        const totalResults = parseInt(countGiftCards[0].count)

        return {
            offset: offset,
            total: totalResults,
            results: giftCards.map(giftCard => {
                return {
                    ...giftCard,
                    plot_ids: giftCard.plot_ids ? giftCard.plot_ids.filter((plot_id: any) => plot_id !== null) : []
                }
            })
        };
    }
    
    static async getGiftCardSummaryCounts(): Promise<{ personal_gift_requests: number, corporate_gift_requests: number, personal_gifted_trees: number, corporate_gifted_trees: number,total_gift_requests: number, total_gifted_trees: number}>{
        const query = `
          SELECT
              COUNT(CASE WHEN group_id IS NULL THEN id END) as personal_gift_requests,
              COUNT(CASE WHEN group_id IS NOT NULL THEN id END) as corporate_gift_requests,
              SUM(CASE WHEN group_id IS NULL THEN no_of_cards ELSE 0 END) as personal_gifted_trees,
              SUM(CASE WHEN group_id IS NOT NULL THEN no_of_cards ELSE 0 END) as corporate_gifted_trees,
              COUNT(id) as total_gift_requests,
              SUM(no_of_cards) as total_gifted_trees
            FROM "${getSchema()}".gift_card_requests
            WHERE request_type = 'Gift Cards'
        `;
        const result = await sequelize.query(query, { type: QueryTypes.SELECT });
        return result[0] as {
            personal_gift_requests: number,
            corporate_gift_requests: number,
            personal_gifted_trees: number,
            corporate_gifted_trees: number,
            total_gift_requests: number,
            total_gifted_trees: number
        };
    }

    static async getMonthOnMonthAnalytics(
        dateField: 'created_at' | 'gifted_on',
        startDate: Date,
        endDate: Date
    ): Promise<{
        summary: {
            total_requests: number,
            total_requests_corporate: number,
            total_requests_personal: number,
            total_trees: number,
            total_trees_corporate: number,
            total_trees_personal: number
        },
        monthly: Array<{
            month: string,
            requests: number,
            requests_corporate: number,
            requests_personal: number,
            trees: number,
            trees_corporate: number,
            trees_personal: number
        }>,
        by_occasion: Array<{
            event_type: string,
            total_requests: number,
            total_trees: number,
            monthly: Array<{
                month: string,
                requests: number,
                requests_corporate: number,
                requests_personal: number,
                trees: number,
                trees_corporate: number,
                trees_personal: number
            }>
        }>
    }> {
        // Query to get aggregated data by month and event_type
        const query = `
            SELECT
                TO_CHAR(DATE_TRUNC('month', ${dateField})::date, 'YYYY-MM') as month,
                COALESCE(event_type, 'Not Specified') as event_type,
                COUNT(CASE WHEN group_id IS NULL THEN id END) as personal_requests,
                COUNT(CASE WHEN group_id IS NOT NULL THEN id END) as corporate_requests,
                SUM(CASE WHEN group_id IS NULL THEN no_of_cards ELSE 0 END) as personal_trees,
                SUM(CASE WHEN group_id IS NOT NULL THEN no_of_cards ELSE 0 END) as corporate_trees,
                COUNT(id) as total_requests,
                SUM(no_of_cards) as total_trees
            FROM "${getSchema()}".gift_card_requests
            WHERE request_type = 'Gift Cards'
                AND ${dateField} IS NOT NULL
                AND ${dateField} BETWEEN :startDate AND :endDate
            GROUP BY month, event_type
            ORDER BY month ASC, event_type ASC
        `;

        const results: any[] = await sequelize.query(query, {
            replacements: { startDate, endDate },
            type: QueryTypes.SELECT
        });

        // Calculate summary totals
        const summary = {
            total_requests: 0,
            total_requests_corporate: 0,
            total_requests_personal: 0,
            total_trees: 0,
            total_trees_corporate: 0,
            total_trees_personal: 0
        };

        // Group data by month for overall monthly trends
        const monthlyMap = new Map<string, {
            month: string,
            requests: number,
            requests_corporate: number,
            requests_personal: number,
            trees: number,
            trees_corporate: number,
            trees_personal: number
        }>();

        // Group data by occasion type
        const occasionMap = new Map<string, {
            event_type: string,
            total_requests: number,
            total_trees: number,
            monthly: Map<string, {
                month: string,
                requests: number,
                requests_corporate: number,
                requests_personal: number,
                trees: number,
                trees_corporate: number,
                trees_personal: number
            }>
        }>();

        // Process results
        for (const row of results) {
            const month = row.month;
            const eventType = row.event_type;
            const personalRequests = parseInt(row.personal_requests) || 0;
            const corporateRequests = parseInt(row.corporate_requests) || 0;
            const personalTrees = parseInt(row.personal_trees) || 0;
            const corporateTrees = parseInt(row.corporate_trees) || 0;
            const totalRequests = parseInt(row.total_requests) || 0;
            const totalTrees = parseInt(row.total_trees) || 0;

            // Update summary
            summary.total_requests += totalRequests;
            summary.total_requests_corporate += corporateRequests;
            summary.total_requests_personal += personalRequests;
            summary.total_trees += totalTrees;
            summary.total_trees_corporate += corporateTrees;
            summary.total_trees_personal += personalTrees;

            // Update monthly data
            if (!monthlyMap.has(month)) {
                monthlyMap.set(month, {
                    month,
                    requests: 0,
                    requests_corporate: 0,
                    requests_personal: 0,
                    trees: 0,
                    trees_corporate: 0,
                    trees_personal: 0
                });
            }
            const monthData = monthlyMap.get(month)!;
            monthData.requests += totalRequests;
            monthData.requests_corporate += corporateRequests;
            monthData.requests_personal += personalRequests;
            monthData.trees += totalTrees;
            monthData.trees_corporate += corporateTrees;
            monthData.trees_personal += personalTrees;

            // Update occasion data
            if (!occasionMap.has(eventType)) {
                occasionMap.set(eventType, {
                    event_type: eventType,
                    total_requests: 0,
                    total_trees: 0,
                    monthly: new Map()
                });
            }
            const occasionData = occasionMap.get(eventType)!;
            occasionData.total_requests += totalRequests;
            occasionData.total_trees += totalTrees;

            if (!occasionData.monthly.has(month)) {
                occasionData.monthly.set(month, {
                    month,
                    requests: 0,
                    requests_corporate: 0,
                    requests_personal: 0,
                    trees: 0,
                    trees_corporate: 0,
                    trees_personal: 0
                });
            }
            const occasionMonthData = occasionData.monthly.get(month)!;
            occasionMonthData.requests += totalRequests;
            occasionMonthData.requests_corporate += corporateRequests;
            occasionMonthData.requests_personal += personalRequests;
            occasionMonthData.trees += totalTrees;
            occasionMonthData.trees_corporate += corporateTrees;
            occasionMonthData.trees_personal += personalTrees;
        }

        // Convert maps to arrays
        const monthly = Array.from(monthlyMap.values()).sort((a, b) => a.month.localeCompare(b.month));
        const by_occasion = Array.from(occasionMap.values()).map(occasion => ({
            event_type: occasion.event_type,
            total_requests: occasion.total_requests,
            total_trees: occasion.total_trees,
            monthly: Array.from(occasion.monthly.values()).sort((a, b) => a.month.localeCompare(b.month))
        })).sort((a, b) => b.total_requests - a.total_requests); // Sort by total requests descending

        return {
            summary,
            monthly,
            by_occasion
        };
    }

    static async getDashboardAnalytics(
        dateField: 'created_at' | 'gifted_on',
        startDate: Date,
        endDate: Date
    ): Promise<{
        green_gifts_sold: {
            total: number,
            total_requests: number,
            by_month: Array<{
                month: string,
                total_sold: number,
                total_requests: number,
                personal_sold: number,
                corporate_sold: number,
                personal_requests: number,
                corporate_requests: number
            }>,
            by_requester: Array<{
                requester_id: string,
                requester_name: string,
                requester_type: 'personal' | 'corporate',
                total_sold: number,
                total_requests: number
            }>,
            by_gift_type: Array<{
                gift_type: string,
                total_sold: number,
                total_requests: number,
                by_month: Array<{
                    month: string,
                    total_sold: number,
                    total_requests: number
                }>
            }>
        },
        gift_cards_demand: {
            total_requests: number,
            personal_requests: number,
            corporate_requests: number,
            by_month: Array<{
                month: string,
                total_requests: number,
                personal_requests: number,
                corporate_requests: number
            }>
        }
    }> {
        const requesterQuery = `
            SELECT
                CASE
                    WHEN gcr.group_id IS NOT NULL THEN CONCAT('group:', gcr.group_id)
                    ELSE CONCAT('user:', gcr.user_id)
                END AS requester_id,
                CASE
                    WHEN gcr.group_id IS NOT NULL THEN COALESCE(g.name, CONCAT('Group ', gcr.group_id::text))
                    ELSE COALESCE(u.name, CONCAT('User ', gcr.user_id::text))
                END AS requester_name,
                CASE
                    WHEN gcr.group_id IS NOT NULL THEN 'corporate'
                    ELSE 'personal'
                END AS requester_type,
                COUNT(gcr.id) AS total_requests,
                COALESCE(SUM(gcr.no_of_cards), 0) AS total_sold
            FROM "${getSchema()}".gift_card_requests gcr
            LEFT JOIN "${getSchema()}".users u ON u.id = gcr.user_id
            LEFT JOIN "${getSchema()}".groups g ON g.id = gcr.group_id
            WHERE gcr.request_type = 'Gift Cards'
                AND gcr.${dateField} IS NOT NULL
                AND gcr.${dateField} BETWEEN :startDate AND :endDate
            GROUP BY 1, 2, 3
            ORDER BY total_sold DESC, total_requests DESC, requester_name ASC
        `;

        const giftTypeQuery = `
            WITH gift_type_monthly AS (
                SELECT
                    TO_CHAR(DATE_TRUNC('month', gcr.${dateField})::date, 'YYYY-MM') AS month,
                    CASE
                        WHEN gcr.event_type IS NULL OR BTRIM(gcr.event_type) = '' THEN 'Not Specified'
                        WHEN LOWER(gcr.event_type) IN ('1', 'birthday') THEN 'Birthday'
                        WHEN LOWER(gcr.event_type) IN ('2', 'memorial') THEN 'Memorial'
                        WHEN LOWER(gcr.event_type) IN ('3', 'general gift', 'general', 'event') THEN 'General Gift'
                        WHEN LOWER(gcr.event_type) IN ('4', 'anniversary') THEN 'Anniversary'
                        WHEN LOWER(gcr.event_type) IN ('5', 'wedding') THEN 'Wedding'
                        WHEN LOWER(gcr.event_type) IN ('6', 'christmas') THEN 'Christmas'
                        WHEN LOWER(gcr.event_type) IN ('7', 'hny', 'new year', 'new_year') THEN 'New Year'
                        ELSE INITCAP(REPLACE(gcr.event_type, '_', ' '))
                    END AS gift_type,
                    COUNT(gcr.id) AS total_requests,
                    COALESCE(SUM(gcr.no_of_cards), 0) AS total_sold
                FROM "${getSchema()}".gift_card_requests gcr
                WHERE gcr.request_type = 'Gift Cards'
                    AND gcr.${dateField} IS NOT NULL
                    AND gcr.${dateField} BETWEEN :startDate AND :endDate
                GROUP BY 1, 2
            )
            SELECT
                gift_type,
                SUM(total_requests) AS total_requests,
                SUM(total_sold) AS total_sold,
                JSON_AGG(
                    JSON_BUILD_OBJECT(
                        'month', month,
                        'total_sold', total_sold,
                        'total_requests', total_requests
                    )
                    ORDER BY month ASC
                ) AS by_month
            FROM gift_type_monthly
            GROUP BY gift_type
            ORDER BY SUM(total_sold) DESC, SUM(total_requests) DESC, gift_type ASC
        `;

        const monthlyQuery = `
            SELECT
                TO_CHAR(DATE_TRUNC('month', gcr.${dateField})::date, 'YYYY-MM') AS month,
                COUNT(gcr.id) AS total_requests,
                COALESCE(SUM(gcr.no_of_cards), 0) AS total_sold,
                COUNT(CASE WHEN gcr.group_id IS NULL THEN gcr.id END) AS personal_requests,
                COUNT(CASE WHEN gcr.group_id IS NOT NULL THEN gcr.id END) AS corporate_requests,
                COALESCE(SUM(CASE WHEN gcr.group_id IS NULL THEN gcr.no_of_cards ELSE 0 END), 0) AS personal_sold,
                COALESCE(SUM(CASE WHEN gcr.group_id IS NOT NULL THEN gcr.no_of_cards ELSE 0 END), 0) AS corporate_sold
            FROM "${getSchema()}".gift_card_requests gcr
            WHERE gcr.request_type = 'Gift Cards'
                AND gcr.${dateField} IS NOT NULL
                AND gcr.${dateField} BETWEEN :startDate AND :endDate
            GROUP BY 1
            ORDER BY month ASC
        `;

        const totalQuery = `
            SELECT
                COUNT(gcr.id) AS total_requests,
                COALESCE(SUM(gcr.no_of_cards), 0) AS total_sold,
                COUNT(CASE WHEN gcr.group_id IS NULL THEN gcr.id END) AS personal_requests,
                COUNT(CASE WHEN gcr.group_id IS NOT NULL THEN gcr.id END) AS corporate_requests
            FROM "${getSchema()}".gift_card_requests gcr
            WHERE gcr.request_type = 'Gift Cards'
                AND gcr.${dateField} IS NOT NULL
                AND gcr.${dateField} BETWEEN :startDate AND :endDate
        `;

        const replacements = { startDate, endDate };
        const [requestersRaw, giftTypesRaw, monthlyRaw, totalRaw] = await Promise.all([
            sequelize.query(requesterQuery, { replacements, type: QueryTypes.SELECT }),
            sequelize.query(giftTypeQuery, { replacements, type: QueryTypes.SELECT }),
            sequelize.query(monthlyQuery, { replacements, type: QueryTypes.SELECT }),
            sequelize.query(totalQuery, { replacements, type: QueryTypes.SELECT }),
        ]);

        const totals = (totalRaw[0] || {}) as any;
        const byMonth = (monthlyRaw as any[]).map((row) => ({
            month: row.month,
            total_sold: parseInt(row.total_sold) || 0,
            total_requests: parseInt(row.total_requests) || 0,
            personal_sold: parseInt(row.personal_sold) || 0,
            corporate_sold: parseInt(row.corporate_sold) || 0,
            personal_requests: parseInt(row.personal_requests) || 0,
            corporate_requests: parseInt(row.corporate_requests) || 0,
        }));

        return {
            green_gifts_sold: {
                total: parseInt(totals.total_sold) || 0,
                total_requests: parseInt(totals.total_requests) || 0,
                by_month: byMonth,
                by_requester: (requestersRaw as any[]).map((row) => ({
                    requester_id: row.requester_id,
                    requester_name: row.requester_name,
                    requester_type: row.requester_type,
                    total_sold: parseInt(row.total_sold) || 0,
                    total_requests: parseInt(row.total_requests) || 0,
                })),
                by_gift_type: (giftTypesRaw as any[]).map((row) => ({
                    gift_type: row.gift_type,
                    total_sold: parseInt(row.total_sold) || 0,
                    total_requests: parseInt(row.total_requests) || 0,
                    by_month: Array.isArray(row.by_month)
                        ? row.by_month.map((item: any) => ({
                            month: item.month,
                            total_sold: parseInt(item.total_sold) || 0,
                            total_requests: parseInt(item.total_requests) || 0,
                        }))
                        : [],
                })),
            },
            gift_cards_demand: {
                total_requests: parseInt(totals.total_requests) || 0,
                personal_requests: parseInt(totals.personal_requests) || 0,
                corporate_requests: parseInt(totals.corporate_requests) || 0,
                by_month: byMonth.map((row) => ({
                    month: row.month,
                    total_requests: row.total_requests,
                    personal_requests: row.personal_requests,
                    corporate_requests: row.corporate_requests,
                })),
            },
        };
    }

    static async createGiftCardRequest(data: GiftCardRequestCreationAttributes): Promise<GiftCardRequest> {
        return await GiftCardRequest.create(data);
    }

    static async updateGiftCardRequest(data: GiftCardRequestAttributes): Promise<GiftCardRequest> {
        const giftCard = await GiftCardRequest.findByPk(data.id);
        if (!giftCard) {
            throw new Error("Gift Card Request not found")
        }

        data.updated_at = new Date();
        const updatedGiftCard = await giftCard.update(data);

        const giftCards = await this.getGiftCardRequests(0, 1, [{ columnField: "id", operatorValue: "equals", value: updatedGiftCard.id }])
        return giftCards.results[0];
    }

    static async updateGiftCardRequests(
        fields: Partial<GiftCardRequestAttributes>,
        whereClause: WhereOptions<GiftCardRequest>,
    ): Promise<number> {

        const [affectedCount] = await GiftCardRequest.update(fields, { where: whereClause });
        return affectedCount;
    }

    static async deleteGiftCardRequest(id: number): Promise<void> {
        const giftCard = await GiftCardRequest.findByPk(id);
        if (!giftCard) {
            throw new Error("Gift Card request not found")
        }
        await giftCard.destroy();
    }

    static async upsertGiftCards(giftCardsRequestId: number, users: { giftedTo: number, assignedTo: number, imageName?: string, count: number }[]): Promise<void> {
        const giftRequest = await GiftCardRequest.findByPk(giftCardsRequestId);
        if (!giftRequest) {
            throw new Error("Gift Card request not found")
        }

        const cards = await GiftCard.findAll({
            where: {
                gift_card_request_id: giftRequest.id,
            }
        })

        const nonUserCards = cards.filter(card => card.gifted_to === null)
        let idx = 0;

        const giftCards: GiftCardCreationAttributes[] = [];
        for (const user of users) {
            const userCards = cards.filter(card => (card.gifted_to === user.giftedTo && card.assigned_to === user.assignedTo));

            const profileImageUrl = user.imageName ? 'https://14treesplants.s3.amazonaws.com/cards/' + giftRequest.request_id + '/' + user.imageName : null
            if (userCards.length > 0 && userCards[0].profile_image_url !== profileImageUrl) {
                await GiftCard.update({
                    profile_image_url: profileImageUrl,
                    updated_at: new Date(),
                }, {
                    where: {
                        gift_card_request_id: giftRequest.id,
                        gifted_to: user.giftedTo,
                        assigned_to: user.assignedTo,
                    }
                })
            }

            if (user.count > userCards.length) {
                let count = user.count - userCards.length;

                for (; idx < nonUserCards.length; idx++) {

                    if (count === 0) break;

                    const card = nonUserCards[idx];
                    card.profile_image_url = profileImageUrl;
                    card.gifted_to = user.giftedTo;
                    card.assigned_to = user.assignedTo;
                    card.updated_at = new Date();

                    await card.save();
                    count -= 1;
                }

                if (count !== 0) {
                    const requests = Array.from({ length: count }, () => ({
                        gift_card_request_id: giftCardsRequestId,
                        gifted_to: user.giftedTo,
                        assigned_to: user.assignedTo,
                        gift_request_user_id: null,
                        profile_image_url: profileImageUrl,
                        created_at: new Date(),
                        updated_at: new Date()
                    }))

                    giftCards.push(...requests);
                }

            }
        }

        if (giftCards.length !== 0) await GiftCard.bulkCreate(giftCards);
    }

    static async getGiftCard(id: number): Promise<GiftCard | null> {
        return await GiftCard.findByPk(id);
    }

    static async getGiftCards(offset: number, limit: number, whereClause: WhereOptions<GiftCard>): Promise<PaginatedResponse<GiftCard>> {
        return {
            offset: offset,
            total: await GiftCard.count({ where: whereClause }),
            results: await GiftCard.findAll({ where: whereClause, limit: limit !== -1 ? limit : undefined, offset: offset })
        }
    }

    static async getDetailedGiftCardByTreeId(treeId: number): Promise<GiftCard | null> {
        const getQuery = `
            SELECT gc.*, sg.name as group_name, su.name as sponsor_name, u.name as user_name, t.sapling_id, t.gifted_by_name, pt.name as plant_type
            FROM "${getSchema()}".gift_cards gc
            JOIN "${getSchema()}".gift_card_requests gcr ON gcr.id = gc.gift_card_request_id
            LEFT JOIN "${getSchema()}".gift_request_users gru ON gru.id = gc.gift_request_user_id
            LEFT JOIN "${getSchema()}".users su ON su.id = gcr.user_id
            LEFT JOIN "${getSchema()}".groups sg ON sg.id = gcr.group_id
            LEFT JOIN "${getSchema()}".users u ON u.id = gru.recipient
            LEFT JOIN "${getSchema()}".trees t ON t.id = gc.tree_id
            LEFT JOIN "${getSchema()}".plant_types pt ON pt.id = t.plant_type_id
            WHERE gc.tree_id = ${treeId};
        `

        const data: any[] = await sequelize.query(getQuery, {
            type: QueryTypes.SELECT
        })

        if (data.length === 0) {
            return null;
        }

        return data[0];
    }

    static async updateGiftCard(giftCard: GiftCardAttributes): Promise<void> {
        const card = await GiftCard.findByPk(giftCard.id);
        if (card) {
            await card.update(giftCard, { returning: false });
        }
    }

    static async updateGiftCards(fields: any, whereClause: WhereOptions): Promise<void> {
        await GiftCard.update(fields, { where: whereClause });
    }

    static async bookGiftCards(cardId: number, treeIds: number[]): Promise<void> {
        // Deduplicate tree IDs to prevent unique constraint violations
        const uniqueTreeIds = Array.from(new Set(treeIds));

        if (uniqueTreeIds.length !== treeIds.length) {
            console.warn(`[WARNING] bookGiftCards: Removed ${treeIds.length - uniqueTreeIds.length} duplicate tree IDs from request`);
        }

        const cards = await GiftCard.findAll({
            where: {
                gift_card_request_id: cardId,
                tree_id: { [Op.is]: null }
            }
        });

        let idx = 0;
        for (let card of cards) {
            if (idx === uniqueTreeIds.length) {
                break;
            }

            card.tree_id = uniqueTreeIds[idx];
            card.updated_at = new Date();
            await card.save();
            idx++;
        }

        if (idx < uniqueTreeIds.length) {
            const remainingTreeIds = uniqueTreeIds.slice(idx);
            const giftCards = remainingTreeIds.map(treeId => {
                return {
                    gift_card_request_id: cardId,
                    tree_id: treeId,
                    created_at: new Date()

                } as GiftCardCreationAttributes
            })

            await GiftCard.bulkCreate(giftCards);
        }
    }

    static async addGiftCardPlots(cardId: number, plotIds: number[]): Promise<void> {
        const plots = await GiftCardPlot.findAll({
            where: {
                gift_card_request_id: cardId,
            }
        })

        plotIds = plotIds.filter(plotId => {
            return !plots.find(plot => plot.plot_id === plotId)
        })

        const giftCardPlots = plotIds.map(plotId => {
            return {
                gift_card_request_id: cardId,
                plot_id: plotId,
                created_at: new Date()

            } as GiftCardPlotCreationAttributes
        })

        await GiftCardPlot.bulkCreate(giftCardPlots);
    }

    static async getGiftCardPlots(cardId: number): Promise<GiftCardPlot[]> {
        const giftCardPlots = await GiftCardPlot.findAll({
            where: {
                gift_card_request_id: cardId
            },
            order: [['id', 'ASC']]
        });

        return giftCardPlots;
    }

    static async getBookedTrees(offset: number, limit: number, filters: FilterItem[]): Promise<PaginatedResponse<GiftCard>> {

        let whereConditions: string = "";
        let replacements: any = {}

        if (filters && filters.length > 0) {
            filters.forEach(filter => {
                let columnField = "gc." + filter.columnField
                // support both snake_case and camelCase from frontend
                const col = filter.columnField;
                if (col === "recipient_name" || col === "recipientName") {
                    columnField = "ru.name"
                } else if (col === "assignee_name" || col === "assigneeName") {
                    columnField = "au.name"
                } else if (col === "sapling_id" || col === "saplingId") {
                    columnField = "t.sapling_id"
                } else if (col === "plant_type" || col === "plantType") {
                    columnField = "pt.name"
                } else if (col === "plot_name" || col === "plotName") {
                    columnField = "p.name"
                } else if (col === "plot_id" || col === "plotId") {
                    columnField = "p.id"
                }
                const { condition, replacement } = getSqlQueryExpression(columnField, filter.operatorValue, filter.columnField, filter.value);
                whereConditions = whereConditions + " " + condition + " AND";
                replacements = { ...replacements, ...replacement }
            })
            whereConditions = whereConditions.substring(0, whereConditions.length - 3);
        }

        const getQuery = `
            SELECT gc.*,
            ru.name as recipient_name, ru.email as recipient_email, ru.phone as recipient_phone,
            au.name as assignee_name, au.email as assignee_email, au.phone as assignee_phone,
            t.sapling_id, t.assigned_to, t.gifted_to, t.assigned_to as assigned, pt.name as plant_type, pt.scientific_name,
            p.id as plot_id, p.name as plot_name,
            ur.relation
            FROM "${getSchema()}".gift_cards gc
            LEFT JOIN "${getSchema()}".trees t ON t.id = gc.tree_id
            LEFT JOIN "${getSchema()}".users ru ON ru.id = t.gifted_to
            LEFT JOIN "${getSchema()}".users au ON au.id = t.assigned_to
            LEFT JOIN "${getSchema()}".user_relations ur ON ur.primary_user = t.gifted_to AND ur.secondary_user = t.assigned_to
            LEFT JOIN "${getSchema()}".plant_types pt ON pt.id = t.plant_type_id
            LEFT JOIN "${getSchema()}".plots p ON p.id = t.plot_id
            WHERE ${whereConditions !== "" ? whereConditions : "1=1"}
            ORDER BY gc.id DESC ${limit === -1 ? "" : `LIMIT ${limit} OFFSET ${offset}`};
        `

        const data: any[] = await sequelize.query(getQuery, {
            type: QueryTypes.SELECT,
            replacements
        })

        const countQuery = `
            SELECT count(gc.id)
            FROM "${getSchema()}".gift_cards gc
            LEFT JOIN "${getSchema()}".trees t ON t.id = gc.tree_id
            LEFT JOIN "${getSchema()}".users ru ON ru.id = t.gifted_to
            LEFT JOIN "${getSchema()}".users au ON au.id = t.assigned_to
            LEFT JOIN "${getSchema()}".plant_types pt ON pt.id = t.plant_type_id
            LEFT JOIN "${getSchema()}".plots p ON p.id = t.plot_id
            WHERE ${whereConditions !== "" ? whereConditions : "1=1"};
        `

        const countData: any[] = await sequelize.query(countQuery, {
            type: QueryTypes.SELECT,
            replacements
        })

        return {
            offset: offset,
            total: parseInt(countData[0].count),
            results: data
        };
    }

    static async addGiftCardTemplate(giftCardUserId: number, templateId: string): Promise<void> {
        const giftCardTemplate = {
            gift_card_id: giftCardUserId,
            template_id: templateId,
            created_at: new Date()
        } as GiftCardUserTemplateCreationAttributes

        await GiftCardUserTemplate.create(giftCardTemplate);
    }

    static async getGiftCardTemplate(giftCardUserId: number): Promise<GiftCardUserTemplate | null> {
        return await GiftCardUserTemplate.findOne({
            where: {
                gift_card_id: giftCardUserId
            }
        })
    }

    static async deleteGiftCardTemplate(giftCardUserId: number) {
        await GiftCardUserTemplate.destroy({
            where: {
                gift_card_id: giftCardUserId
            }
        })
    }

    static async getPlantTypeTemplateId(plantType: string) {
        return await PlantTypeCardTemplate.findOne({
            where: {
                plant_type: plantType,
            }
        })
    }


    // DELETE functions
    static async deleteGiftCardRequests(whereClause: WhereOptions): Promise<void> {
        await GiftCardRequest.destroy({
            where: whereClause
        })
    }

    static async deleteGiftCards(whereClause: WhereOptions): Promise<void> {
        await GiftCard.destroy({
            where: whereClause
        })
    }

    static async deleteGiftCardRequestPlots(whereClause: WhereOptions): Promise<void> {
        await GiftCardPlot.destroy({
            where: whereClause
        })
    }

    static async deleteGiftCardTemplates(whereClause: WhereOptions): Promise<void> {
        await GiftCardUserTemplate.destroy({
            where: whereClause
        })
    }

    static async getGiftCardUserAndTreeDetails(giftCardRequestId: number): Promise<GiftCard[]> {

        const getQuery = `
            SELECT gc.id, gc.card_image_url, gru.mail_sent, gru.mail_sent_assignee, gc.slide_id, gru.recipient, gru.assignee,
            ru.name as user_name, ru.email as user_email,
            au.name as assigned_to_name, au.email as assigned_to_email, ur.relation,
            t.sapling_id, t.description as event_name, t.event_type, t.gifted_by_name as planted_via, pt.name as plant_type, pt.scientific_name
            FROM "${getSchema()}".gift_cards gc
            LEFT JOIN "${getSchema()}".gift_request_users gru ON gru.id = gc.gift_request_user_id
            LEFT JOIN "${getSchema()}".users ru ON ru.id = gru.recipient
            LEFT JOIN "${getSchema()}".users au ON au.id = gru.assignee
            LEFT JOIN "${getSchema()}".user_relations ur ON ur.primary_user = gru.recipient AND ur.secondary_user = gru.assignee
            LEFT JOIN "${getSchema()}".trees t ON t.id = gc.tree_id
            LEFT JOIN "${getSchema()}".plant_types pt ON pt.id = t.plant_type_id
            WHERE gc.gift_card_request_id = ${giftCardRequestId}
            ORDER BY gc.id
        `

        const data: any[] = await sequelize.query(getQuery, {
            type: QueryTypes.SELECT
        })

        return data;
    }


    /// *** GIFT REQUEST USERS *** ///

    static async getGiftRequestUsersByQuery(whereClause: WhereOptions<GiftRequestUser>): Promise<GiftRequestUser[]> {
        return await GiftRequestUser.findAll({ where: whereClause });
    }

    static async getGiftRequestUsers(giftCardRequestId: number): Promise<GiftRequestUser[]> {
        const getQuery = `
            SELECT gru.*, 
            ru.name as recipient_name, ru.email as recipient_email, ru.phone as recipient_phone, ru.communication_email as recipient_communication_email,
            au.name as assignee_name, au.email as assignee_email, au.phone as assignee_phone, au.communication_email as assignee_communication_email, ur.relation
            FROM "${getSchema()}".gift_request_users gru
            LEFT JOIN "${getSchema()}".users ru ON ru.id = gru.recipient
            LEFT JOIN "${getSchema()}".users au ON au.id = gru.assignee
            LEFT JOIN "${getSchema()}".user_relations ur ON ur.primary_user = gru.recipient AND ur.secondary_user = gru.assignee
            WHERE gru.gift_request_id = ${giftCardRequestId}
            ORDER BY gru.id
        `

        const data: any[] = await sequelize.query(getQuery, {
            type: QueryTypes.SELECT
        })

        return data;
    }

    static async addGiftRequestUsers(data: GiftRequestUserCreationAttributes[], returning: boolean = false): Promise<GiftRequestUser[] | void> {
        const response = await GiftRequestUser.bulkCreate(data, { returning: returning });
        return returning ? response : undefined;
    }

    static async updateGiftRequestUsers(fields: any, whereClause: WhereOptions<GiftRequestUserAttributes>): Promise<void> {
        await GiftRequestUser.update(fields, { where: whereClause });
    }

    static async deleteGiftRequestUsers(whereClause: WhereOptions<GiftRequestUserAttributes>): Promise<void> {
        await GiftRequestUser.destroy({ where: whereClause });
    }
}
