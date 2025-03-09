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

export class GiftCardsRepository {

    public static async getGiftRequestTags(offset: number, limit: number): Promise<PaginatedResponse<string>> {
        const tags: string[] = [];

        const getUniqueTagsQuery = 
            `SELECT DISTINCT tag
                FROM "14trees_2".gift_card_requests gcr,
                unnest(gcr.tags) AS tag
                ORDER BY tag
                OFFSET ${offset} LIMIT ${limit};`;

        const countUniqueTagsQuery = 
            `SELECT count(DISTINCT tag)
                FROM "14trees_2".gift_card_requests gcr,
                unnest(gcr.tags) AS tag;`;

        const tagsResp: any[] = await sequelize.query( getUniqueTagsQuery,{ type: QueryTypes.SELECT });
        tagsResp.forEach(r => tags.push(r.tag));

        const countResp: any[] = await sequelize.query( countUniqueTagsQuery,{ type: QueryTypes.SELECT });
        const total = parseInt(countResp[0].count);
        return { offset: offset, total: total, results: tags };
    }

    static async getGiftCardRequests(offset: number, limit: number, filters?: FilterItem[], orderBy?: { column: string, order: "ASC" | "DESC" }[]): Promise<PaginatedResponse<GiftCardRequest>> {
        let whereConditions: string = "";
        let replacements: any = {}

        if (filters && filters.length > 0) {
            filters.forEach(filter => {
                let columnField = "gcr." + filter.columnField
                if (filter.columnField === "user_name") {
                    columnField = "u.name"
                } else if (filter.columnField === "group_name") {
                    columnField = "g.name"
                } else if (filter.columnField === "created_by_name") {
                    columnField = "cu.name"
                }
                const { condition, replacement } = getSqlQueryExpression(columnField, filter.operatorValue, filter.columnField, filter.value);
                whereConditions = whereConditions + " " + condition + " AND";
                replacements = { ...replacements, ...replacement }
            })
            whereConditions = whereConditions.substring(0, whereConditions.length - 3);
        }

        const getQuery = `
            SELECT gcr.*, 
                u.name as user_name, u.email as user_email, u.phone as user_phone, g.name as group_name, cu.name as created_by_name,
                SUM(CASE 
                    WHEN gc.tree_id is not null
                    THEN 1
                    ELSE 0
                END) AS booked,
                SUM(CASE 
                    WHEN gru.mail_sent = true
                    THEN 1
                    ELSE 0
                END) AS mailed_count,
                COUNT(gru.id) as users_count,
                SUM(CASE 
                    WHEN t.assigned_to is not null
                    THEN 1
                    ELSE 0
                END) AS assigned,
                CASE
                    WHEN gcr.category = 'Foundation'
                    THEN (
                        CASE 
                            WHEN gcr.request_type = 'Normal Assignment'
                            THEN 1500
                            ELSE 2000
                        END
                    )
                    ELSE 3000
                END * gcr.no_of_cards AS total_amount,
                array_agg(distinct gc.presentation_id) as presentation_ids
            FROM "14trees_2".gift_card_requests gcr
            LEFT JOIN "14trees_2".users u ON u.id = gcr.user_id
            LEFT JOIN "14trees_2".users cu ON cu.id = gcr.created_by
            LEFT JOIN "14trees_2".groups g ON g.id = gcr.group_id
            LEFT JOIN "14trees_2".gift_cards gc ON gc.gift_card_request_id = gcr.id
            left join "14trees_2".trees t on t.id = gc.tree_id
            LEFT JOIN "14trees_2".gift_request_users gru ON gru.gift_request_id = gcr.id
            WHERE ${whereConditions !== "" ? whereConditions : "1=1"}
            GROUP BY gcr.id, u.id, cu.id, g.name
            ORDER BY ${ orderBy && orderBy.length !== 0 ? orderBy.map(o => o.column + " " + o.order).join(", ") : 'gcr.id DESC'}
            ${limit === -1 ? "" : `LIMIT ${limit} OFFSET ${offset}`};
        `

        const countQuery = `
            SELECT COUNT(*) 
            FROM "14trees_2".gift_card_requests gcr
            LEFT JOIN "14trees_2".users u ON u.id = gcr.user_id
            LEFT JOIN "14trees_2".users cu ON cu.id = gcr.created_by
            LEFT JOIN "14trees_2".groups g ON g.id = gcr.group_id
            WHERE ${whereConditions !== "" ? whereConditions : "1=1"};
        `

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

    static async updateGiftCardRequests(fields: any, whereClause: WhereOptions): Promise<void> {
        await GiftCardRequest.update(fields, { where: whereClause });
    }

    static async deleteGiftCardRequest(id: number): Promise<void> {
        const giftCard = await GiftCardRequest.findByPk(id);
        if (!giftCard) {
            throw new Error("Gift Card request not found")
        }
        await giftCard.destroy();
    }


    static async getGiftRequestAnalytics(): Promise<any> {
        const query = `
            SELECT 
            COUNT(CASE 
                WHEN gcr.group_id IS NULL THEN gcr.id 
                ELSE NULL 
            END) AS personal_requests,
            COUNT(CASE 
                WHEN gcr.group_id IS NOT NULL THEN gcr.id 
                ELSE NULL 
            END) AS corporate_requests,
            SUM (
                CASE
                    WHEN gcr.group_id IS NULL
                    THEN gcr.no_of_cards
                    ELSE 0
                END
            ) as personal_trees,
            SUM (
                CASE
                    WHEN gcr.group_id IS NOT NULL
                    THEN gcr.no_of_cards
                    ELSE 0
                END
            ) as corporate_trees
            FROM "14trees_2".gift_card_requests gcr
        `

        const resp: any = await sequelize.query(query, {
            type: QueryTypes.SELECT
        })

        return resp[0];
    }

    // Adding new function for Distribution Chart
    static async getGiftRequestDistribution(): Promise<any> {
        const query = `
    SELECT 
        COUNT(CASE WHEN event_type = '1' THEN id ELSE NULL END) AS birthday_requests,
        COUNT(CASE WHEN event_type = '2' THEN id ELSE NULL END) AS memorial_requests,
        COUNT(CASE WHEN event_type = '3' THEN id ELSE NULL END) AS general_requests
    FROM "14trees_2".gift_card_requests;
`;
        
       const result = await sequelize.query(query, { type: QueryTypes.SELECT });
       console.log("Query Result:", JSON.stringify(result, null, 2));  // Log the result clearly eli

        return result;
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

            const profileImageUrl = user.imageName ? 'https://14treesplants.s3.amazonaws.com/cards/'+ giftRequest.request_id + '/' + user.imageName : null
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

                for ( ; idx < nonUserCards.length; idx++) {

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
            SELECT gc.*, sg.name as group_name, su.name as sponsor_name, u.name as user_name, t.sapling_id, pt.name as plant_type
            FROM "14trees_2".gift_cards gc
            JOIN "14trees_2".gift_card_requests gcr ON gcr.id = gc.gift_card_request_id
            LEFT JOIN "14trees_2".gift_request_users gru ON gru.id = gc.gift_request_user_id
            LEFT JOIN "14trees_2".users su ON su.id = gcr.user_id
            LEFT JOIN "14trees_2".groups sg ON sg.id = gcr.group_id
            LEFT JOIN "14trees_2".users u ON u.id = gru.recipient
            LEFT JOIN "14trees_2".trees t ON t.id = gc.tree_id
            LEFT JOIN "14trees_2".plant_types pt ON pt.id = t.plant_type_id
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

        const cards = await GiftCard.findAll({
            where: {
                gift_card_request_id: cardId,
                tree_id: { [Op.is]: null }
            }
        });

        let idx = 0;
        for (let card of cards) {
            if (idx === treeIds.length) {
                break;
            }

            card.tree_id = treeIds[idx];
            card.updated_at = new Date();
            await card.save();
            idx++;
        }

        if (idx < treeIds.length) {
            const remainingTreeIds = treeIds.slice(idx);
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

    static async getBookedTrees(giftCardRequestId: number, offset: number, limit: number): Promise<PaginatedResponse<GiftCard>> {

        const getQuery = `
            SELECT gc.*,
            ru.name as recipient_name, ru.email as recipient_email, ru.phone as recipient_phone,
            au.name as assignee_name, au.email as assignee_email, au.phone as assignee_phone,
            t.sapling_id, t.assigned_to, t.gifted_to, t.assigned_to as assigned, pt.name as plant_type, pt.scientific_name,
            ur.relation
            FROM "14trees_2".gift_cards gc
            LEFT JOIN "14trees_2".trees t ON t.id = gc.tree_id
            LEFT JOIN "14trees_2".users ru ON ru.id = t.gifted_to
            LEFT JOIN "14trees_2".users au ON au.id = t.assigned_to
            LEFT JOIN "14trees_2".user_relations ur ON ur.primary_user = t.gifted_to AND ur.secondary_user = t.assigned_to
            LEFT JOIN "14trees_2".plant_types pt ON pt.id = t.plant_type_id
            WHERE gc.gift_card_request_id = ${giftCardRequestId}
            ORDER BY gc.id DESC ${limit === -1 ? "" : `LIMIT ${limit} OFFSET ${offset}`};
        `

        const data: any[] = await sequelize.query(getQuery, {
            type: QueryTypes.SELECT
        })

        const countQuery = `
            SELECT count(gc.id)
            FROM "14trees_2".gift_cards gc
            WHERE gc.gift_card_request_id = ${giftCardRequestId};
        `

        const countData: any[] = await sequelize.query(countQuery, {
            type: QueryTypes.SELECT
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
            SELECT gc.id, gc.card_image_url, gru.mail_sent, gc.slide_id, gru.recipient, gru.assignee,
            ru.name as user_name, ru.email as user_email,
            au.name as assigned_to_name, au.email as assigned_to_email, ur.relation,
            t.sapling_id, t.description as event_name, t.event_type, t.gifted_by_name as planted_via, pt.name as plant_type, pt.scientific_name
            FROM "14trees_2".gift_cards gc
            LEFT JOIN "14trees_2".gift_request_users gru ON gru.id = gc.gift_request_user_id
            LEFT JOIN "14trees_2".users ru ON ru.id = gru.recipient
            LEFT JOIN "14trees_2".users au ON au.id = gru.assignee
            LEFT JOIN "14trees_2".user_relations ur ON ur.primary_user = gru.recipient AND ur.secondary_user = gru.assignee
            LEFT JOIN "14trees_2".trees t ON t.id = gc.tree_id
            LEFT JOIN "14trees_2".plant_types pt ON pt.id = t.plant_type_id
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
            ru.name as recipient_name, ru.email as recipient_email, ru.phone as recipient_phone,
            au.name as assignee_name, au.email as assignee_email, au.phone as assignee_phone, ur.relation
            FROM "14trees_2".gift_request_users gru
            LEFT JOIN "14trees_2".users ru ON ru.id = gru.recipient
            LEFT JOIN "14trees_2".users au ON au.id = gru.assignee
            LEFT JOIN "14trees_2".user_relations ur ON ur.primary_user = gru.recipient AND ur.secondary_user = gru.assignee
            WHERE gru.gift_request_id = ${giftCardRequestId}
            ORDER BY gru.id
        `

        const data: any[] = await sequelize.query(getQuery, {
            type: QueryTypes.SELECT
        })

        return data;
    }

    static async addGiftRequestUsers(data: GiftRequestUserCreationAttributes[], returning: boolean = false): Promise<GiftRequestUser[] | void> {
        const response =  await GiftRequestUser.bulkCreate(data, { returning: returning });
        return returning ? response : undefined;
    }

    static async updateGiftRequestUsers(fields: any, whereClause: WhereOptions<GiftRequestUserAttributes>): Promise<void> {
        await GiftRequestUser.update(fields, { where: whereClause });
    }

    static async deleteGiftRequestUsers(whereClause: WhereOptions<GiftRequestUserAttributes>): Promise<void> {
        await GiftRequestUser.destroy({ where: whereClause });
    }
}
