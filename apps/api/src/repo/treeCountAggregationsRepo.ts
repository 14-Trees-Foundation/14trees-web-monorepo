import { Op, QueryTypes, WhereOptions } from "sequelize";
import { PaginatedResponse } from "../models/pagination";
import { TreeCountAggregation, TreeCountAggregationAttributes, TreeCountAggregationCreationAttributes } from "../models/tree_count_aggregation";
import { sequelize } from "../config/postgreDB";


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
            order: [['updated_at', 'ASC']],
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

    public static async calculateTreeCountAggregations(): Promise<void> {

        const query = `
            SELECT p.id as plot_id, 
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
                THEN 1 
                ELSE 0 
            END) AS available,
            SUM(case
                WHEN ts.tree_status = 'dead'
                    or ts.tree_status = 'lost'
                THEN 1
                ELSE 0
            END) as void_total,
            SUM(case
                WHEN (ts.tree_status = 'dead'
                    or ts.tree_status = 'lost') and t.assigned_to is not null
                THEN 1
                ELSE 0
            END) as void_assigned,
            SUM(CASE 
                WHEN (t.mapped_to_user IS NOT NULL 
                    OR t.mapped_to_group IS NOT NULL)
                    and (ts.tree_status = 'dead'
                    or ts.tree_status = 'lost')
                THEN 1 
                ELSE 0 
            END) AS void_booked,
            SUM(CASE 
                WHEN (t.mapped_to_user IS NULL 
                    AND t.mapped_to_group IS NULL 
                    AND t.assigned_to IS NULL 
                    AND t.id IS NOT NULL)
                    and (ts.tree_status = 'dead'
                    or ts.tree_status = 'lost')
                THEN 1 
                ELSE 0 
            END) AS void_available
            FROM "14trees".plots p
            LEFT JOIN "14trees".trees t ON t.plot_id = p.id
            LEFT JOIN (SELECT *
                FROM (
                    SELECT *,
                        ROW_NUMBER() OVER (PARTITION BY sapling_id ORDER BY created_at DESC) AS rn
                    FROM "14trees".trees_snapshots
                ) AS snapshots
            WHERE snapshots.rn = 1) as ts ON ts.sapling_id = t.sapling_id
            GROUP by p.id
        `

        const data = await sequelize.query(query, {
            type: QueryTypes.SELECT
        })

        const requests: TreeCountAggregationCreationAttributes[] = [];

        data.forEach((d: any) => {
            requests.push({
                plot_id: d.plot_id,
                total: d.total,
                assigned: d.assigned,
                booked: d.booked,
                available: d.available,
                void_total: d.void_total,
                void_assigned: d.void_assigned,
                void_booked: d.void_booked,
                void_available: d.void_available,
                updated_at: new Date(),
            })
        })

        // upsert all the requests. plot id is unique
        await TreeCountAggregation.bulkCreate(requests, 
            { updateOnDuplicate: [
                'total', 
                'booked', 
                'assigned', 
                'available', 
                'void_total', 
                'void_booked', 
                'void_assigned', 
                'void_available',
                'updated_at'
            ]})
    }
}