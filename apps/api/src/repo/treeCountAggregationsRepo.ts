import { Op, QueryTypes, WhereOptions } from "sequelize";
import { PaginatedResponse } from "../models/pagination";
import { TreeCountAggregation, TreeCountAggregationAttributes, TreeCountAggregationCreationAttributes } from "../models/tree_count_aggregation";
import { sequelize } from "../config/postgreDB";

function sleep(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms));
}

export class TreeCountAggregationsRepo {

    public static async getTreeCountAggregations(offset: number, limit: number, plotIds?: number[]): Promise<PaginatedResponse<TreeCountAggregation>> {

        let whereClause: WhereOptions = {};
        if (plotIds) whereClause = { plot_id: { [Op.in]: plotIds } }

        return {
            offset: offset,
            total: await TreeCountAggregation.count({ where: whereClause }),
            results: await TreeCountAggregation.findAll({
                where: whereClause,
                order: [['id', 'DESC']],
                offset,
                limit
            })
        };
    }

    public static async checkAndRecalculateData() {
        const resp = await TreeCountAggregation.findAll({
            limit: 1,
            order: [['updated_at', 'DESC']],
        });

        let recalculate = true;
        const currentTime = new Date().getTime();
        if (resp.length > 0) {
            if (currentTime - resp[0].updated_at.getTime() < 15 * 60 * 1000) {
                recalculate = false;
            }
        }

        if (recalculate) await this.calculateTreeCountAggregations();
    }

    static async getAggregatedData(offset: number, limit: number) {
        const query = `
            SELECT p.id as plot_id, pt.id as plant_type_id,
            COUNT(t.id) as total, 
            COUNT(t.assigned_to) as assigned,
            SUM(CASE 
                WHEN t.mapped_to_user IS NOT NULL 
                    OR t.mapped_to_group IS NOT NULL
                THEN 1 
                ELSE 0 
            END) AS booked,
            SUM(CASE 
                WHEN t.mapped_to_user IS NULL 
                    AND t.mapped_to_group IS NULL 
                    AND t.assigned_to IS NULL 
                    AND t.id IS NOT NULL
                    AND ppt.sustainable = true
                THEN 1 
                ELSE 0 
            END) AS available,
            SUM(case
                WHEN t.tree_status = 'dead'
                    or t.tree_status = 'lost'
                THEN 1
                ELSE 0
            END) as void_total,
            SUM(case
                WHEN (t.tree_status = 'dead'
                    or t.tree_status = 'lost') and t.assigned_to is not null
                THEN 1
                ELSE 0
            END) as void_assigned,
            SUM(CASE 
                WHEN (t.mapped_to_user IS NOT NULL 
                    OR t.mapped_to_group IS NOT NULL)
                    and (t.tree_status = 'dead'
                    or t.tree_status = 'lost')
                THEN 1 
                ELSE 0 
            END) AS void_booked,
            SUM(CASE 
                WHEN (t.mapped_to_user IS NULL 
                    AND t.mapped_to_group IS NULL 
                    AND t.assigned_to IS NULL 
                    AND t.id IS NOT NULL)
                    and (t.tree_status = 'dead'
                    or t.tree_status = 'lost')
                THEN 1 
                ELSE 0 
            END) AS void_available,
            SUM(CASE 
                WHEN t.mapped_to_user IS NULL 
                    AND t.mapped_to_group IS NULL 
                    AND t.assigned_to IS NULL 
                    AND t.id IS NOT NULL
                    AND (t.tree_status IS NULL OR (t.tree_status != 'dead' AND t.tree_status != 'lost'))
                    AND ptct.plant_type IS NOT NULL
                    AND ppt.sustainable = true
                THEN 1 
                ELSE 0 
            END) AS card_available,
            SUM(CASE 
                WHEN t.mapped_to_user IS NULL 
                    AND t.mapped_to_group IS NULL
                    AND t.assigned_to IS NOT NULL
                THEN 1 
                ELSE 0 
            END) AS unbooked_assigned
            FROM "14trees_2".plots p
            LEFT JOIN "14trees_2".trees t ON t.plot_id = p.id
            LEFT JOIN "14trees_2".plant_types pt on pt.id = t.plant_type_id
            LEFT JOIN "14trees_2".plant_type_card_templates ptct on ptct.plant_type = pt."name"
            LEFT JOIN "14trees_2".plot_plant_types ppt ON ppt.plot_id = t.plot_id AND ppt.plant_type_id = t.plant_type_id
            GROUP by p.id, pt.id
            ORDER BY p.id
            OFFSET ${offset} LIMIT ${limit};
        `

        return await sequelize.query(query, {
            type: QueryTypes.SELECT
        })
    }

    public static async calculateTreeCountAggregations(): Promise<void> {

        // delete old aggregated data
        await TreeCountAggregation.destroy({ where: {}, truncate: true });

        let offset = 0, limit = 1000;
        while (true) {
            const data = await this.getAggregatedData(offset, limit);

            const requests: TreeCountAggregationCreationAttributes[] = [];

            data.forEach((d: any) => {
                requests.push({
                    plot_id: d.plot_id,
                    plant_type_id: d.plant_type_id,
                    total: d.total,
                    assigned: d.assigned,
                    booked: d.booked,
                    available: d.available,
                    void_total: d.void_total,
                    void_assigned: d.void_assigned,
                    void_booked: d.void_booked,
                    void_available: d.void_available,
                    card_available: d.card_available,
                    unbooked_assigned: d.unbooked_assigned,
                    updated_at: new Date(),
                })
            })
    
            // create new aggregated data
            if (requests.length > 0) await TreeCountAggregation.bulkCreate(requests);

            if (data.length < limit) break;
            offset += limit;

            await sleep(1000);
        }

    }
}