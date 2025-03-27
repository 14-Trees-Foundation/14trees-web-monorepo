import { QueryTypes, WhereOptions } from "sequelize";
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

    public static async getDetailsTransactions(offset: number, limit: number, groupId: number): Promise<PaginatedResponse<GiftRedeemTransaction>> {
        
        const query = `
            SELECT 
                grt.*,
                cu.name AS created_by_name,
                ru.name AS recipient_name,
                gca.gc_count AS trees_count,
                COALESCE(tree_details.tree_info, '[]'::jsonb) AS tree_details
            FROM "14trees".gift_redeem_transactions grt
            JOIN "14trees".users cu ON cu.id = grt.created_by
            JOIN "14trees".users ru ON ru.id = grt.recipient

            -- Subquery to count gift_cards per grt
            JOIN (
                SELECT grt_id, COUNT(gc.id) AS gc_count
                FROM "14trees".gift_redeem_transaction_cards grtc
                JOIN "14trees".gift_cards gc ON gc.id = grtc.gc_id
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
                        'template_image', ptct.template_image
                    ) AS tree_data
                    FROM "14trees".gift_redeem_transaction_cards grtc
                    JOIN "14trees".gift_cards gc ON gc.id = grtc.gc_id
                    JOIN "14trees".trees t ON t.id = gc.tree_id
                    JOIN "14trees".plant_types pt ON pt.id = t.plant_type_id
                    JOIN "14trees".plant_type_card_templates ptct ON ptct.plant_type = pt.name
                    WHERE grtc.grt_id = grt.id
                    ORDER BY grtc.gc_id  -- Change ordering as needed
                    LIMIT 5
                ) AS limited_tree_data
            ) AS tree_details ON true
            WHERE grt.group_id = :groupId
            GROUP BY grt.id, cu.name, ru.name, gca.gc_count, tree_details.tree_info
            ${limit > 0 ? 'OFFSET :offset LIMIT :limit;' : ';'}
        `

        const result: GiftRedeemTransaction[] = await sequelize.query(query, {
            type: QueryTypes.SELECT,
            replacements: {
                groupId,
                limit, 
                offset,
            }
        })

        const count = await GiftRedeemTransaction.count({ where: { group_id: groupId }});

        return {
            total: count,
            offset: offset,
            results: result
        }
    }

    public static async createTransaction(data: GiftRedeemTransactionCreationAttributes): Promise<GiftRedeemTransaction> {
        
        return await GiftRedeemTransaction.create(data);
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

}