import { QueryTypes, WhereOptions } from 'sequelize';
import { Plot, PlotAttributes, PlotCreationAttributes } from '../models/plot'
import { FilterItem, PaginatedResponse } from '../models/pagination';
import { sequelize } from '../config/postgreDB';
import { getSqlQueryExpression } from '../controllers/helper/filters';

export class PlotRepository {
    public static async updatePlot(plotData: PlotAttributes): Promise<Plot> {
        const plot = await Plot.findByPk(plotData.id);
        if (!plot) {
            throw new Error("Plot doesn't exist");
        }
        plotData.updated_at = new Date();
        const updatedPlot = await plot.update(plotData);

        const filters: FilterItem[] = [{ columnField: 'id', operatorValue: 'equals', value: updatedPlot.id.toString()}];
        const plotsResp = await this.getPlots(0, 1, filters);
        return plotsResp.results[0] || updatedPlot;
    }

    public static async updatePlots(fields: any, whereClause: WhereOptions): Promise<void> {
        await Plot.update(fields, { where: whereClause, returning: false });
    }

    public static async addPlot(plotData: any): Promise<Plot> {
        let siteId: number | null = null;
        if (!isNaN(parseInt(plotData.site_id))) {
            siteId = parseInt(plotData.site_id);
        }
        let obj: PlotCreationAttributes = {
            name: plotData.plot_name,
            plot_id: plotData.plot_id || null,
            tags: plotData.tags || null,
            gat: plotData.gat || null,
            category: plotData.category || null,
            site_id: siteId || null,
            label: plotData.label || null,
            accessibility_status: plotData.accessibility_status || null,
            created_at: new Date(),
            updated_at: new Date()
        };
        const plot = await Plot.create(obj);
        
        const filters: FilterItem[] = [{ columnField: 'id', operatorValue: 'equals', value: plot.id.toString()}];
        const plotsResp = await this.getPlots(0, 1, filters);
        return plotsResp.results[0] || plot;
    }

    public static async getPlots(offset: number = 0, limit: number = 10, filters: FilterItem[], orderBy?: { column: string, order: "ASC" | "DESC" }[]): Promise<PaginatedResponse<Plot>> {

        let whereCondition = "";
        let replacements: any = {}
        if (filters && filters.length > 0) {
            filters.forEach(filter => {
                let columnField = "p." + filter.columnField
                if (filter.columnField === 'site_name' && filter.operatorValue === 'isEmpty' ) columnField = 'p.site_id';
                else if (filter.columnField === 'site_name') {
                    const condition1 = getSqlQueryExpression("s.name_english", filter.operatorValue, filter.columnField + "_1", filter.value);
                    const condition2 = getSqlQueryExpression("s.name_marathi", filter.operatorValue, filter.columnField + "_2", filter.value);

                    whereCondition = whereCondition + " (" + condition1.condition + " OR " + condition2.condition + ") AND";
                    replacements = { ...replacements, ...condition1.replacement, ...condition2.replacement }

                    return;
                }
                const { condition, replacement } = getSqlQueryExpression(columnField, filter.operatorValue, filter.columnField, filter.value);
                whereCondition = whereCondition + " " + condition + " AND";
                replacements = { ...replacements, ...replacement }
            })
            whereCondition = whereCondition.substring(0, whereCondition.length - 3);
        }

        const query = `
        SELECT p.*,
            case 
                when s.name_english is null 
                    then s.name_marathi
                    else s.name_english 
                end site_name,
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
            END) AS void_available,
            SUM(CASE 
                WHEN t.mapped_to_user IS NULL 
                    AND t.mapped_to_group IS NULL 
                    AND t.assigned_to IS NULL 
                    AND t.id IS NOT NULL
                    AND (ts.tree_status IS NULL OR (ts.tree_status != 'dead' AND ts.tree_status != 'lost'))
                    AND ptct.plant_type IS NOT NULL
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
        LEFT JOIN "14trees_2".sites s ON p.site_id = s.id
        LEFT JOIN "14trees_2".trees t ON t.plot_id = p.id
        LEFT JOIN "14trees_2".plant_types pt on pt.id = t.plant_type_id
        LEFT JOIN "14trees_2".plant_type_card_templates ptct on ptct.plant_type = pt."name"
        LEFT JOIN (SELECT *
            FROM (
                SELECT *,
                    ROW_NUMBER() OVER (PARTITION BY sapling_id ORDER BY created_at DESC) AS rn
                FROM "14trees_2".trees_snapshots
            ) AS snapshots
        WHERE snapshots.rn = 1) as ts ON ts.sapling_id = t.sapling_id
        WHERE ${whereCondition !== "" ? whereCondition : "1=1"}
        GROUP BY p.id, s.id
        ORDER BY ${ orderBy && orderBy.length !== 0 ? orderBy.map(o => o.column + " " + o.order).join(", ") : 'p.id DESC'}
        OFFSET ${offset} ${limit === -1 ? "" : `LIMIT ${limit}`};
        `

        const countPlotsQuery = 
            `SELECT count(*)
            FROM "14trees_2".plots p
            LEFT JOIN "14trees_2".sites s ON p.site_id = s.id
            WHERE ${whereCondition !== "" ? whereCondition : "1=1"};
            `
        
        const plots: any = await sequelize.query(query, {
            replacements: replacements,
            type: QueryTypes.SELECT
        })

        const countPlots: any = await sequelize.query(countPlotsQuery, {
            replacements: replacements,
            type: QueryTypes.SELECT
        })
        const totalResults = parseInt(countPlots[0].count)

        return { offset: offset, total: totalResults, results: plots as Plot[]};
    }

    public static async deletePlot(plotId: string): Promise<number> {
        const resp = await Plot.destroy({ where: { id: plotId } });
        return resp;
    }

    public static async plotsCount(): Promise<number> {
        return await Plot.count()
    }

    public static async getPlotTags(offset: number, limit: number): Promise<PaginatedResponse<string>> {
        const tags: string[] = [];

        const getUniqueTagsQuery = 
            `SELECT DISTINCT tag
                FROM "14trees_2".plots p,
                unnest(p.tags) AS tag
                ORDER BY tag
                OFFSET ${offset} LIMIT ${limit};`;

        const countUniqueTagsQuery = 
            `SELECT count(DISTINCT tag)
                FROM "14trees_2".plots p,
                unnest(p.tags) AS tag;`;

        const tagsResp: any[] = await sequelize.query( getUniqueTagsQuery,{ type: QueryTypes.SELECT });
        tagsResp.forEach(r => tags.push(r.tag));

        const countResp: any[] = await sequelize.query( countUniqueTagsQuery,{ type: QueryTypes.SELECT });
        const total = parseInt(countResp[0].count);
        return { offset: offset, total: total, results: tags };
    }

    public static async getDeletedPlotsFromList(plotIds: number[]): Promise<number[]> {
        const query = `SELECT num
        FROM unnest(array[:plot_ids]::int[]) AS num
        LEFT JOIN "14trees_2".plots AS p
        ON num = p.id
        WHERE p.id IS NULL;`
    
        const result = await sequelize.query(query, {
            replacements: { plot_ids: plotIds },
            type: QueryTypes.SELECT
        })
    
        return result.map((row: any) => row.num);
    }

    public static async treesCountForCategory() {

        const query = `
            SELECT p.category,
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
                END) AS available
            FROM "14trees_2".trees t
            LEFT JOIN "14trees_2".plots p ON p.id = t.plot_id
            LEFT JOIN (SELECT *
                FROM (
                    SELECT *,
                        ROW_NUMBER() OVER (PARTITION BY sapling_id ORDER BY created_at DESC) AS rn
                    FROM "14trees_2".trees_snapshots
                ) AS snapshots
                WHERE snapshots.rn = 1) as ts on ts.sapling_id = t.sapling_id
            WHERE (ts.tree_status is null or ts.tree_status in ('healthy', 'diseased'))
            GROUP BY p.category;
            `

        const counts: any[] = await sequelize.query(query, {
            type: QueryTypes.SELECT,
        })

        return { offset: 0, total: counts.length, results: counts };
    }

    public static async getPlotAggregations(offset: number = 0, limit: number = 10, filters: FilterItem[], orderBy?: { column: string, order: "ASC" | "DESC" }[]): Promise<PaginatedResponse<Plot>> {

        let whereCondition = "";
        let replacements: any = {}

        let treeCondition = "";
        if (filters && filters.length > 0) {
            filters.forEach(filter => {
                let columnField = "p." + filter.columnField
                if (filter.columnField === 'created_at') columnField = 't.created_at';
                const { condition, replacement } = getSqlQueryExpression(columnField, filter.operatorValue, filter.columnField, filter.value);
                replacements = { ...replacements, ...replacement }

                if (filter.columnField === 'created_at') {
                    treeCondition = condition;
                } else {
                    whereCondition = whereCondition + " " + condition + " AND";
                }
            })
            whereCondition = whereCondition.substring(0, whereCondition.length - 3);
        }

        const query = `
            SELECT p.id, p.name,
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
                SUM(CASE 
                    WHEN t.mapped_to_user IS NULL 
                        AND t.mapped_to_group IS NULL 
                        AND t.assigned_to IS NOT NULL 
                        AND t.id IS NOT NULL
                    THEN 1 
                    ELSE 0 
                END) AS unbooked_assigned
            FROM "14trees_2".plots p
            LEFT JOIN "14trees_2".trees t ON p.id = t.plot_id ${treeCondition !== "" ? "AND " + treeCondition : ""}
            WHERE ${whereCondition !== "" ? whereCondition : "1=1"}
            GROUP BY p.id
            ORDER BY ${ orderBy && orderBy.length !== 0 ? orderBy.map(o => o.column + " " + o.order).join(", ") : 'p.id DESC'}
            OFFSET ${offset} ${limit === -1 ? "" : `LIMIT ${limit}`};
        `

        const countPlotsQuery = 
            `SELECT count(*)
            FROM "14trees_2".plots p
            WHERE ${whereCondition !== "" ? whereCondition : "1=1"};
            `
        
        const plots: any = await sequelize.query(query, {
            replacements: replacements,
            type: QueryTypes.SELECT
        })

        const countPlots: any = await sequelize.query(countPlotsQuery, {
            replacements: replacements,
            type: QueryTypes.SELECT
        })
        const totalResults = parseInt(countPlots[0].count)

        return { offset: offset, total: totalResults, results: plots as Plot[]};
    }
}