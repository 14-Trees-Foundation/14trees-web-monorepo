import { Op, QueryTypes, WhereOptions } from "sequelize";
import { PaginatedResponse } from "../models/pagination";
import { GiftRedeemTransaction, GiftRedeemTransactionCreationAttributes, GRTCard } from "../models/gift_redeem_transaction";
import { sequelize } from "../config/postgreDB";


export class GRTransactionsRepository {

    public static async getTransactions(offset: number, limit: number, whereClause: WhereOptions<GiftRedeemTransaction>): Promise<PaginatedResponse<GiftRedeemTransaction>> {
        
        return {
            offset: offset,
            total: await GiftRedeemTransaction.count({ where: whereClause }),
            results: await GiftRedeemTransaction.findAll({
                where: whereClause,
                offset: offset,
                limit: limit > 0 ? limit : undefined,
            }),
        }
    }

    public static async getDetailsTransactions(offset: number, limit: number, type: 'group' | 'user', id: number, search?: string): Promise<PaginatedResponse<GiftRedeemTransaction>> {
        
        const query = `
            SELECT 
                grt.*,
                cu.name AS created_by_name,
                ru.name AS recipient_name,
                ru.email AS recipient_email,
                ru.communication_email AS recipient_communication_email,
                gca.gc_count AS trees_count,
                COALESCE(tree_details.tree_info, '[]'::jsonb) AS tree_details
            FROM "14trees_2".gift_redeem_transactions grt
            JOIN "14trees_2".users cu ON cu.id = grt.created_by
            JOIN "14trees_2".users ru ON ru.id = grt.recipient

            -- Subquery to count gift_cards per grt
            JOIN (
                SELECT grt_id, COUNT(gc.id) AS gc_count
                FROM "14trees_2".gift_redeem_transaction_cards grtc
                JOIN "14trees_2".gift_cards gc ON gc.id = grtc.gc_id
                GROUP BY grt_id
            ) AS gca ON gca.grt_id = grt.id

            -- Lateral join to aggregate tree details into an array with a limit of 5
            LEFT JOIN LATERAL (
                SELECT jsonb_agg(tree_data) AS tree_info
                FROM (
                    SELECT jsonb_build_object(
                        'sapling_id', t.sapling_id,
                        'plant_type', pt.name,
                        'illustration_s3_path', pt.illustration_s3_path,
                        'card_image_url', gc.card_image_url,
                        'template_image', ptct.template_image,
                        'logo_url', gcr.logo_url
                    ) AS tree_data
                    FROM "14trees_2".gift_redeem_transaction_cards grtc
                    JOIN "14trees_2".gift_cards gc ON gc.id = grtc.gc_id
                    JOIN "14trees_2".gift_card_requests gcr ON gcr.id = gc.gift_card_request_id
                    JOIN "14trees_2".trees t ON t.id = gc.tree_id
                    JOIN "14trees_2".plant_types pt ON pt.id = t.plant_type_id
                    JOIN "14trees_2".plant_type_card_templates ptct ON ptct.plant_type = pt.name
                    WHERE grtc.grt_id = grt.id
                    ORDER BY grtc.gc_id  -- Change ordering as needed
                    LIMIT 5
                ) AS limited_tree_data
            ) AS tree_details ON true
            WHERE ${type === 'group' ? 'grt.group_id = :id' : 'grt.user_id = :id'} ${search ? 'AND ru.name ILIKE :search' : ''}
            GROUP BY grt.id, cu.id, ru.id, gca.gc_count, tree_details.tree_info
            ORDER BY grt.id DESC
            ${limit > 0 ? 'OFFSET :offset LIMIT :limit;' : ';'}
        `

        const result: GiftRedeemTransaction[] = await sequelize.query(query, {
            type: QueryTypes.SELECT,
            replacements: {
                id,
                limit, 
                offset,
                search: `%${search}%`
            }
        })

        const countQuery = `
            SELECT COUNT(*)
            FROM "14trees_2".gift_redeem_transactions grt
            JOIN "14trees_2".users ru ON ru.id = grt.recipient
            WHERE ${type === 'group' ? 'grt.group_id = :id' : 'grt.user_id = :id'} ${search ? 'AND ru.name ILIKE :search' : ''}
        `
        const count: any = await sequelize.query(countQuery, {
            type: QueryTypes.SELECT,
            replacements: { id, search: `%${search}%` }
        })

        return {
            total: parseInt(count[0].count),
            offset: offset,
            results: result
        }
    }

    public static async getDetailedTransactionById(transactionId: number) {
        const query = `
             SELECT 
                grt.*,
                g.name AS group_name,
                g.logo_url AS logo_url,
                ru.name AS recipient_name,
                ru.email AS recipient_email,
                u.name AS sponsor_name,
                u.email AS sponsor_email
            FROM "14trees_2".gift_redeem_transactions grt
            JOIN "14trees_2".users ru ON ru.id = grt.recipient
            LEFT JOIN "14trees_2".groups g ON g.id = grt.group_id
            LEFT JOIN "14trees_2".users u ON u.id = grt.user_id
            WHERE grt.id = :transactionId
        `
        const result: GiftRedeemTransaction[] = await sequelize.query(query, {
            type: QueryTypes.SELECT,
            replacements: {
                transactionId,
            }
        })
        if (result.length === 0) {
            throw new Error("Transaction not found");
        }
        return result[0];
    }

    public static async createTransaction(data: GiftRedeemTransactionCreationAttributes): Promise<GiftRedeemTransaction> {
        
        return await GiftRedeemTransaction.create(data);
    }

    public static async deleteTransactions(whereClause: WhereOptions<GRTCard>): Promise<void> {
        await GiftRedeemTransaction.destroy({ where: whereClause });
    }

    public static async addCardsToTransaction(trnId: number, gcIds: number[]) {
        const existing = await GRTCard.findAll({ where: { grt_id: trnId } });
        const newIds = gcIds.filter(id => existing.every(grc => grc.gc_id !== id));

        if (newIds.length > 0) {
            await GRTCard.bulkCreate(newIds.map(gcId => {
                return {
                    gc_id: gcId,
                    grt_id: trnId,
                    created_at: new Date(),
                }
            }))
        } 
    }

    public static async getGRTCards(whereClause: WhereOptions<GRTCard>): Promise<GRTCard[]> {
        
        return await GRTCard.findAll({
            where: whereClause
        });
    }

    public static async deleteCardsFromTransaction(gcIds: number[]): Promise<void> {
        if (gcIds.length === 0) return;

        await GRTCard.destroy({
            where: {
                gc_id: {[Op.in]: gcIds}
            }
        });
    }

    public static async updateTransactions(fields: any, whereClause: WhereOptions<GiftRedeemTransaction>) {
        await GiftRedeemTransaction.update(fields, { where: whereClause });
    }


    public static async getTransactionTrees(transactionId: number) {
        const query = `
            SELECT t.sapling_id, pt.name AS plant_type, pt.scientific_name, gc.card_image_url
            FROM "14trees_2".gift_redeem_transaction_cards grtc
            JOIN "14trees_2".gift_cards gc ON gc.id = grtc.gc_id
            JOIN "14trees_2".trees t ON t.id = gc.tree_id
            JOIN "14trees_2".plant_types pt ON pt.id = t.plant_type_id
            WHERE grtc.grt_id = :transactionId
        `

        const result: { sapling_id: string, plant_type: string, scientific_name: string, card_image_url: string }[] = await sequelize.query(query, {
            type: QueryTypes.SELECT,
            replacements: {
                transactionId,
            }
        })
        return result;
    }

    public static async getTransactionGiftCardIds(transactionId: number) {
        return (await GRTCard.findAll({ where: { grt_id: transactionId } })).map(grc => grc.gc_id);
    }
}