import { sequelize } from '../config/postgreDB';
import { getSqlQueryExpression } from '../controllers/helper/filters';
import { FilterItem, PaginatedResponse } from '../models/pagination';
import { TreesSnapshot, TreesSnapshotCreationAttributes } from '../models/trees_snapshots';
import { Op, QueryTypes, WhereOptions } from 'sequelize';
import { getSchema } from '../helpers/utils';
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
            FROM "${getSchema()}".trees_snapshots ts
            JOIN "${getSchema()}".trees t ON t.sapling_id = ts.sapling_id
            JOIN "${getSchema()}".plots p ON p.id = t.plot_id
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
            FROM "${getSchema()}".trees_snapshots ts
            JOIN "${getSchema()}".trees t ON t.sapling_id = ts.sapling_id
            JOIN "${getSchema()}".plots p ON p.id = t.plot_id
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
            LEFT JOIN "${getSchema()}".trees_snapshots AS v
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
            FROM "${getSchema()}".trees_snapshots ts
            JOIN "${getSchema()}".trees t ON ts.sapling_id = t.sapling_id
            JOIN "${getSchema()}".plots p ON t.plot_id = p.id
            JOIN "${getSchema()}".sites s ON p.site_id = s.id
            JOIN "${getSchema()}".users u ON ts.user_id = u.id
            GROUP BY u.id, p.id, p.name, s.id, s.name_english, DATE(ts.image_date)
            ORDER BY audit_date DESC;
        `

        const result: any[] = await sequelize.query(query, {
            type: QueryTypes.SELECT
        })

        return result;
    }

    public static async getAggregatedAuditReport(): Promise<any[]> {
        const query = `
            SELECT 
                DATE(ts.image_date) AS audit_date, 
                u.name AS user_name, 
                COUNT(t.sapling_id) AS total_trees_audited
            FROM "${getSchema()}".trees_snapshots ts
            JOIN "${getSchema()}".trees t ON ts.sapling_id = t.sapling_id
            JOIN "${getSchema()}".users u ON ts.user_id = u.id
            GROUP BY u.id, DATE(ts.image_date)
            ORDER BY audit_date DESC;
        `;
    
        const result: any[] = await sequelize.query(query, {
            type: QueryTypes.SELECT
        });
    
        return result;
    }

    public static async getPlotsWithAuditedTrees(): Promise<any[]> {
        const query = `
            SELECT 
                p.id as plot_id, p."name" AS plot_name,
                t.sapling_id,
                latest_ts.image_date
            FROM "${getSchema()}".trees t
            JOIN "${getSchema()}".plots p ON t.plot_id = p.id
            LEFT JOIN (
                SELECT DISTINCT ON (sapling_id) sapling_id, image_date
                FROM "${getSchema()}".trees_snapshots
                ORDER BY sapling_id, image_date DESC
            ) latest_ts ON latest_ts.sapling_id = t.sapling_id
            WHERE t.plot_id IN (
                SELECT DISTINCT t.plot_id
                FROM "${getSchema()}".trees t
                JOIN "${getSchema()}".trees_snapshots ts ON ts.sapling_id = t.sapling_id
            );
        `;
    
        const result: any[] = await sequelize.query(query, {
            type: QueryTypes.SELECT
        });
    
        return result;
    }

    /**
     * Paginated + filterable audit report for frontend table (grouped by user, plot, date)
     * Supports optional filters: startDate, endDate (inclusive), userId, plotId, siteId, search (matches plot or site or user name),
     * sorting (default audit_date DESC).
     */
    public static async getAuditReportPaginated(params: {
        offset: number;
        limit: number;
        startDate?: string;
        endDate?: string;
        userId?: number;
        plotId?: number;
        siteId?: number;
        search?: string;
        sortBy?: string;
        sortDir?: 'asc' | 'desc';
        filters?: FilterItem[];
    }): Promise<{ offset: number; total: number; results: any[] }> {
        const { offset, limit, startDate, endDate, userId, plotId, siteId, search, sortBy, sortDir, filters } = params;

        const replacements: any = {};
        const whereParts: string[] = [];

        // If frontend passed a `filters` array, convert each to SQL using helper
        if (filters && filters.length > 0) {
            filters.forEach((filter, idx) => {
                const valuePlaceHolder = `${filter.columnField}_${idx}`;

                // map frontend column names to actual SQL fields
                const col = (filter.columnField || '').toString().toLowerCase();
                let columnField = 'ts.' + filter.columnField;
                if (col === 'user_name' || col === 'username' || col === 'user') columnField = 'u.name';
                else if (col === 'plot_name' || col === 'plotname' || col === 'plot') columnField = 'p.name';
                else if (col === 'site_name' || col === 'sitename' || col === 'site') columnField = 's.name_english';
                else if (col === 'audit_date' || col === 'image_date' || col === 'date') columnField = 'DATE(ts.image_date)';
                else if (col === 'user_id' || col === 'userid') columnField = 'u.id';
                else if (col === 'plot_id' || col === 'plotid') columnField = 'p.id';
                else if (col === 'site_id' || col === 'siteid') columnField = 's.id';
                else if (col === 'trees_audited') columnField = 'COUNT(t.sapling_id)';
                else columnField = 'ts.' + filter.columnField;

                const { condition, replacement } = getSqlQueryExpression(columnField, filter.operatorValue, valuePlaceHolder, filter.value);
                whereParts.push(condition);
                Object.assign(replacements, replacement);
            });
        }

        // also accept the simpler param-style filters (keeps backward compatibility)
        if (startDate) { whereParts.push('DATE(ts.image_date) >= :startDate'); replacements.startDate = startDate; }
        if (endDate) { whereParts.push('DATE(ts.image_date) <= :endDate'); replacements.endDate = endDate; }
        if (userId) { whereParts.push('u.id = :userId'); replacements.userId = userId; }
        if (plotId) { whereParts.push('p.id = :plotId'); replacements.plotId = plotId; }
        if (siteId) { whereParts.push('s.id = :siteId'); replacements.siteId = siteId; }
        if (search) {
            whereParts.push('(u.name ILIKE :search OR p.name ILIKE :search OR s.name_english ILIKE :search)');
            replacements.search = `%${search}%`;
        }

        const whereClause = whereParts.length ? 'WHERE ' + whereParts.join(' AND ') : '';

        const allowedSort = new Set(['audit_date','user_name','plot_name','site_name','trees_audited']);
        const finalSortBy = allowedSort.has((sortBy||'').toLowerCase()) ? (sortBy as string) : 'audit_date';
        const finalSortDir = (sortDir && sortDir.toLowerCase() === 'asc') ? 'ASC' : 'DESC';

        // Base grouped query (without limit) so we can reuse for count
        const baseQuery = `
            SELECT 
                u.id as user_id,
                u.name AS user_name,
                p.id as plot_id,
                p.name AS plot_name,
                s.id as site_id,
                s.name_english AS site_name,
                DATE(ts.image_date) AS audit_date,
                COUNT(t.sapling_id) AS trees_audited
            FROM "${getSchema()}".trees_snapshots ts
            JOIN "${getSchema()}".trees t ON ts.sapling_id = t.sapling_id
            JOIN "${getSchema()}".plots p ON t.plot_id = p.id
            JOIN "${getSchema()}".sites s ON p.site_id = s.id
            JOIN "${getSchema()}".users u ON ts.user_id = u.id
            ${whereClause}
            GROUP BY u.id, p.id, p.name, s.id, s.name_english, DATE(ts.image_date)
        `;

        const paginatedQuery = `
            ${baseQuery}
            ORDER BY ${finalSortBy} ${finalSortDir}
            OFFSET :offset LIMIT :limit
        `;
        replacements.offset = offset;
        replacements.limit = limit;

        const results: any[] = await sequelize.query(paginatedQuery, { replacements, type: QueryTypes.SELECT });

        const countQuery = `SELECT COUNT(*) AS count FROM ( ${baseQuery} ) grouped`;
        const countRes: any = await sequelize.query(countQuery, { replacements, type: QueryTypes.SELECT });
        const total = parseInt(countRes[0]?.count || '0', 10);
        return { offset, total, results };
    }
}
