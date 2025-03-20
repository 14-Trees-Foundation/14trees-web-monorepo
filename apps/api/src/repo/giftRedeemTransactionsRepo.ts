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
            SELECT DISTINCT ON (grt.id) 
                grt.*,
                t.sapling_id,
                pt."name"  as plant_type,
                pt.illustration_s3_path,
                ptct.template_image,
                gc.card_image_url,
                cu.name as created_by_name,
                ru.name as recipient_name,
                gc_count.gc_count as trees_count
            FROM "14trees_2".gift_redeem_transactions grt
            JOIN "14trees_2".gift_redeem_transaction_cards grtc ON grtc.grt_id = grt.id
            JOIN "14trees_2".gift_cards gc ON gc.id = grtc.gc_id 
            JOIN "14trees_2".trees t ON t.id = gc.tree_id 
            JOIN "14trees_2".plant_types pt ON pt.id = t.plant_type_id
            JOIN "14trees_2".plant_type_card_templates ptct ON ptct.plant_type = pt.name
            JOIN "14trees_2".users cu ON cu.id = grt.created_by
            JOIN "14trees_2".users ru ON ru.id = grt.recipient
            -- Subquery to count gift_cards per grt
            JOIN (
            SELECT grt_id, COUNT(gc.id) AS gc_count
            FROM "14trees_2".gift_redeem_transaction_cards grtc
            JOIN "14trees_2".gift_cards gc ON gc.id = grtc.gc_id
            GROUP BY grt_id
            ) AS gc_count ON gc_count.grt_id = grt.id
            WHERE grt.group_id = :groupId
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