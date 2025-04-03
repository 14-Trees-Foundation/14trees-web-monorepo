import { sequelize } from '../config/postgreDB';
import { getSqlQueryExpression } from '../controllers/helper/filters';
import { FilterItem, PaginatedResponse } from '../models/pagination';
import { TreesSnapshot, TreesSnapshotCreationAttributes } from '../models/trees_snapshots';
import { Op, QueryTypes, WhereOptions } from 'sequelize'
export class TreesSnapshotRepository {

    static async addTreesSnapshot(data: TreesSnapshotCreationAttributes): Promise<TreesSnapshot> {
        return await TreesSnapshot.create(data);
    }

    static async bulkAddTreesSnapshots(data: TreesSnapshotCreationAttributes[]): Promise<TreesSnapshot[]> {
        return await TreesSnapshot.bulkCreate(data);
    }

    static async getTreesSnapshots(offset: number, limit: number, filters: FilterItem[]): Promise<PaginatedResponse<TreesSnapshot>> {
        let whereCondition = "";
        let replacements: any = {}
        if (filters && filters.length > 0) {
            filters.forEach(filter => {
                let columnField = "ts." + filter.columnField
                let valuePlaceHolder = filter.columnField
                if (filter.columnField === "site_id") {
                    columnField = 'p.site_id'
                }
                const { condition, replacement } = getSqlQueryExpression(columnField, filter.operatorValue, valuePlaceHolder, filter.value);
                whereCondition = whereCondition + " " + condition + " AND";
                replacements = { ...replacements, ...replacement }
            })
            whereCondition = whereCondition.substring(0, whereCondition.length - 3);
        }

        let query = `
            SELECT ts.*
            FROM "14trees_2".trees_snapshots ts
            JOIN "14trees_2".trees t ON t.sapling_id = ts.sapling_id
            JOIN "14trees_2".plots p ON p.id = t.plot_id
            WHERE ${whereCondition !== "" ? whereCondition : "1=1"}
            ORDER BY ts.id DESC
        `

        if (limit > 0) { query += `OFFSET ${offset} LIMIT ${limit};` }

        const images: any = await sequelize.query(query, {
            replacements: replacements,
            type: QueryTypes.SELECT
        })

        const countQuery = `
            SELECT count(*) as count
            FROM "14trees_2".trees_snapshots ts
            JOIN "14trees_2".trees t ON t.sapling_id = ts.sapling_id
            JOIN "14trees_2".plots p ON p.id = t.plot_id
            WHERE ${whereCondition !== "" ? whereCondition : "1=1"}
        `
        const resp = await sequelize.query(countQuery, {
            replacements: replacements,
        });
        return { offset: offset, total: (resp[0][0] as any)?.count, results: images as TreesSnapshot[] };
    }

    public static async getDeletedTreesSnapshotsFromList(treeSnapshotIds: number[]): Promise<number[]> {
        const query = `SELECT num
            FROM unnest(array[:tree_snapshot_ids]::int[]) AS num
            LEFT JOIN "14trees_2".trees_snapshots AS v
            ON num = v.id
            WHERE v.id IS NULL;`

        const result = await sequelize.query(query, {
            replacements: { tree_snapshot_ids: treeSnapshotIds },
            type: QueryTypes.SELECT
        })

        return result.map((row: any) => row.num);
    }

    public static async deleteTreeSnapshots(imageIds: number[]): Promise<void> {
        await TreesSnapshot.destroy({ where: { id: { [Op.in]: imageIds } } })
    }


    public static async getAuditReport(): Promise<any[]> {
        const query = `
            SELECT 
                u.name AS user_name, 
                p.name AS plot_name, 
                s.name_english AS site_name, 
                DATE(ts.image_date) AS audit_date, 
                COUNT(t.sapling_id) AS trees_audited
            FROM "14trees_2".trees_snapshots ts
            JOIN "14trees_2".trees t ON ts.sapling_id = t.sapling_id
            JOIN "14trees_2".plots p ON t.plot_id = p.id
            JOIN "14trees_2".sites s ON p.site_id = s.id
            JOIN "14trees_2".users u ON ts.user_id = u.id
            GROUP BY u.id, p.id, p.name, s.id, s.name_english, DATE(ts.image_date)
            ORDER BY audit_date DESC;
        `

        const result: any[] = await sequelize.query(query, {
            type: QueryTypes.SELECT
        })

        return result;
    }
}
