import { Op, QueryTypes } from "sequelize";
import { GiftCard, GiftCardAttributes, GiftCardCreationAttributes } from "../models/gift_card";
import { FilterItem, PaginatedResponse } from "../models/pagination";
import { getSqlQueryExpression } from "../controllers/helper/filters";
import { sequelize } from "../config/postgreDB";
import { GiftCardUser, GiftCardUserCreationAttributes } from "../models/gift_card_user";
import { GiftCardPlot, GiftCardPlotCreationAttributes } from "../models/gift_card_plot";
import { GiftCardUserTemplate, GiftCardUserTemplateCreationAttributes } from "../models/gift_card_user_template";
import { PlantTypeCardTemplate } from "../models/plant_type_card_template";

export class GiftCardsRepository {

    static async getGiftCards(offset: number, limit: number, filters?: FilterItem[]): Promise<PaginatedResponse<GiftCard>> {
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
            FROM "14trees_2".gift_cards gc
            LEFT JOIN "14trees_2".users u ON u.id = gc.user_id
            LEFT JOIN "14trees_2".groups g ON g.id = gc.group_id
            LEFT JOIN "14trees_2".gift_card_plots gcp ON gcp.card_id = gc.id
            WHERE ${whereConditions !== "" ? whereConditions : "1=1"}
            GROUP BY gc.id, u.name, g.name
            ORDER BY gc.id DESC ${limit === -1 ? "" : `LIMIT ${limit} OFFSET ${offset}`};
        `

        const countQuery = `
            SELECT COUNT(*) 
            FROM "14trees_2".gift_cards gc
            LEFT JOIN "14trees_2".users u ON u.id = gc.user_id
            LEFT JOIN "14trees_2".groups g ON g.id = gc.group_id
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

    static async addGiftCard(data: GiftCardCreationAttributes): Promise<GiftCard> {
        return await GiftCard.create(data);
    }

    static async updateGiftCard(data: GiftCardAttributes): Promise<GiftCard> {
        const giftCard = await GiftCard.findByPk(data.id);
        if (!giftCard) {
            throw new Error("Gift Card entry not found")
        }

        giftCard.updated_at = new Date();
        const updatedGiftCard = await giftCard.update(data);
        return updatedGiftCard;
    }

    static async deleteGiftCard(id: number): Promise<void> {
        const giftCard = await GiftCard.findByPk(id);
        if (!giftCard) {
            throw new Error("Gift Card entry not found")
        }
        await giftCard.destroy();
    }

    static async addGiftCardUsers(cardId: number, userIds: number[]): Promise<void> {
        const giftCardUsers = userIds.map(userId => {
            return {
                card_id: cardId,
                user_id: userId,
                created_at: new Date()
                
            } as GiftCardUserCreationAttributes
        })

        await GiftCardUser.bulkCreate(giftCardUsers);
    }

    static async getGiftCardUser(id: number): Promise<GiftCardUser | null> {
        return await GiftCardUser.findByPk(id);
    }

    static async getDetailedGiftCardUser(id: number): Promise<GiftCardUser | null> {
        const getQuery = `
            SELECT gcu.*, u.name as user_name, t.sapling_id, pt.name as plant_type
            FROM "14trees_2".gift_card_users gcu
            LEFT JOIN "14trees_2".users u ON u.id = gcu.user_id
            LEFT JOIN "14trees_2".trees t ON t.id = gcu.tree_id
            LEFT JOIN "14trees_2".plant_types pt ON pt.id = t.plant_type_id
            WHERE gcu.id = ${id};
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

        const cardUsers = await GiftCardUser.findAll({
            where: {
                card_id: cardId,
                tree_id: { [Op.is]: null }
            }
        });

        let idx = 0;
        for (let cardUser of cardUsers) {
            if (idx === treeIds.length) {
                break;
            }

            cardUser.tree_id = treeIds[idx];
            cardUser.updated_at = new Date();
            await cardUser.save();
            idx++;
        }

        if (idx < treeIds.length) {
            const remainingTreeIds = treeIds.slice(idx);
            const giftCardUsers = remainingTreeIds.map(treeId => {
                return {
                    card_id: cardId,
                    tree_id: treeId,
                    created_at: new Date()
                    
                } as GiftCardUserCreationAttributes
            })

            await GiftCardUser.bulkCreate(giftCardUsers);
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

    static async getBookedCards(giftCardId: number, offset: number, limit: number): Promise<PaginatedResponse<GiftCardUser>> {

        const getQuery = `
            SELECT gcu.*, u.name as user_name, t.sapling_id, pt.name as plant_type
            FROM "14trees_2".gift_card_users gcu
            LEFT JOIN "14trees_2".users u ON u.id = gcu.user_id
            LEFT JOIN "14trees_2".trees t ON t.id = gcu.tree_id
            LEFT JOIN "14trees_2".plant_types pt ON pt.id = t.plant_type_id
            WHERE gcu.card_id = ${giftCardId}
            ORDER BY gcu.id DESC ${limit === -1 ? "" : `LIMIT ${limit} OFFSET ${offset}`};
        `

        const data: any[] = await sequelize.query(getQuery, {
            type: QueryTypes.SELECT
        })

        const countQuery = `
            SELECT count(gcu.id)
            FROM "14trees_2".gift_card_users gcu
            WHERE gcu.card_id = ${giftCardId};
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
