import { Op, QueryTypes } from "sequelize";
import { GiftCardRequest, GiftCardRequestAttributes, GiftCardRequestCreationAttributes } from "../models/gift_card_request";
import { FilterItem, PaginatedResponse } from "../models/pagination";
import { getSqlQueryExpression } from "../controllers/helper/filters";
import { sequelize } from "../config/postgreDB";
import { GiftCard, GiftCardCreationAttributes } from "../models/gift_card";
import { GiftCardPlot, GiftCardPlotCreationAttributes } from "../models/gift_card_plot";
import { GiftCardUserTemplate, GiftCardUserTemplateCreationAttributes } from "../models/gift_card_user_template";
import { PlantTypeCardTemplate } from "../models/plant_type_card_template";

export class GiftCardsRepository {

    static async getGiftCardRequests(offset: number, limit: number, filters?: FilterItem[]): Promise<PaginatedResponse<GiftCardRequest>> {
        let whereConditions: string = "";
        let replacements: any = {}

        if (filters && filters.length > 0) {
            filters.forEach(filter => {
                let columnField = "gc." + filter.columnField
                if (filter.columnField === "user_name") {
                    columnField = "u.name"
                } else if (filter.columnField === "group_name") {
                    columnField = "g.name"
                }
                const { condition, replacement } = getSqlQueryExpression(columnField, filter.operatorValue, filter.columnField, filter.value);
                whereConditions = whereConditions + " " + condition + " AND";
                replacements = { ...replacements, ...replacement }
            })
            whereConditions = whereConditions.substring(0, whereConditions.length - 3);
        }

        const getQuery = `
            SELECT gc.*, u.name as user_name, g.name as group_name, array_agg(DISTINCT gcp.plot_id) as plot_ids
            FROM "14trees".gift_card_requests gc
            LEFT JOIN "14trees".users u ON u.id = gc.user_id
            LEFT JOIN "14trees".groups g ON g.id = gc.group_id
            LEFT JOIN "14trees".gift_card_plots gcp ON gcp.card_id = gc.id
            WHERE ${whereConditions !== "" ? whereConditions : "1=1"}
            GROUP BY gc.id, u.name, g.name
            ORDER BY gc.id DESC ${limit === -1 ? "" : `LIMIT ${limit} OFFSET ${offset}`};
        `

        const countQuery = `
            SELECT COUNT(*) 
            FROM "14trees".gift_card_requests gc
            LEFT JOIN "14trees".users u ON u.id = gc.user_id
            LEFT JOIN "14trees".groups g ON g.id = gc.group_id
            WHERE ${whereConditions !== "" ? whereConditions : "1=1"};
        `

        const giftCards: any = await sequelize.query(getQuery, {
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
            results: giftCards
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

        giftCard.updated_at = new Date();
        const updatedGiftCard = await giftCard.update(data);
        return updatedGiftCard;
    }

    static async deleteGiftCardRequest(id: number): Promise<void> {
        const giftCard = await GiftCardRequest.findByPk(id);
        if (!giftCard) {
            throw new Error("Gift Card request not found")
        }
        await giftCard.destroy();
    }

    static async createGiftCards(giftCardsRequestId: number, users: { userId: number, imageName?: string }[]): Promise<void> {
        const giftRequest = await GiftCardRequest.findByPk(giftCardsRequestId);
        if (!giftRequest) {
            throw new Error("Gift Card request not found")
        }

        // create gift card
        const giftCards = users.map(user => {
            return {
                gift_card_request_id: giftCardsRequestId,
                user_id: user.userId,
                profile_image_url: user.imageName ? 'https://14treesplants.s3.amazonaws.com/gift-card-requests/'+ giftRequest.request_id + '/' + user.imageName : null,
                created_at: new Date(),
                updated_at: new Date()
            } as GiftCardCreationAttributes
        })

        await GiftCard.bulkCreate(giftCards);
    }

    static async getGiftCard(id: number): Promise<GiftCard | null> {
        return await GiftCard.findByPk(id);
    }

    static async getDetailedGiftCard(id: number): Promise<GiftCard | null> {
        const getQuery = `
            SELECT gc.*, u.name as user_name, t.sapling_id, pt.name as plant_type
            FROM "14trees".gift_cards gc
            LEFT JOIN "14trees".users u ON u.id = gc.user_id
            LEFT JOIN "14trees".trees t ON t.id = gc.tree_id
            LEFT JOIN "14trees".plant_types pt ON pt.id = t.plant_type_id
            WHERE gc.id = ${id};
        `

        const data: any[] = await sequelize.query(getQuery, {
            type: QueryTypes.SELECT
        })

        if (data.length === 0) {
            return null;
        }

        return data[0];
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
        const giftCardPlots = plotIds.map(plotId => {
            return {
                card_id: cardId,
                plot_id: plotId,
                created_at: new Date()
                
            } as GiftCardPlotCreationAttributes
        })

        await GiftCardPlot.bulkCreate(giftCardPlots);
    }

    static async getGiftCardPlots(cardId: number): Promise<GiftCardPlot[]> {
        const giftCardPlots = await GiftCardPlot.findAll({
            where: {
                card_id: cardId
            }
        });

        return giftCardPlots;
    }

    static async getBookedCards(giftCardRequestId: number, offset: number, limit: number): Promise<PaginatedResponse<GiftCard>> {

        const getQuery = `
            SELECT gc.*, u.name as user_name, t.sapling_id, pt.name as plant_type
            FROM "14trees".gift_cards gc
            LEFT JOIN "14trees".users u ON u.id = gc.user_id
            LEFT JOIN "14trees".trees t ON t.id = gc.tree_id
            LEFT JOIN "14trees".plant_types pt ON pt.id = t.plant_type_id
            WHERE gc.gift_card_request_id = ${giftCardRequestId}
            ORDER BY gc.id DESC ${limit === -1 ? "" : `LIMIT ${limit} OFFSET ${offset}`};
        `

        const data: any[] = await sequelize.query(getQuery, {
            type: QueryTypes.SELECT
        })

        const countQuery = `
            SELECT count(gc.id)
            FROM "14trees".gift_cards gc
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
}
