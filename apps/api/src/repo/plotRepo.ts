import { QueryTypes, WhereOptions } from 'sequelize';
import { Plot, PlotAttributes, PlotCreationAttributes } from '../models/plot'
import { FilterItem, PaginatedResponse } from '../models/pagination';
import { sequelize } from '../config/postgreDB';
import { getSqlQueryExpression } from '../controllers/helper/filters';
import { SortOrder } from '../models/common';
import { getSchema } from '../helpers/utils';

export class PlotRepository {
    public static async updatePlot(plotData: PlotAttributes): Promise<Plot> {
        const plot = await Plot.findByPk(plotData.id);
        if (!plot) {
            throw new Error("Plot doesn't exist");
        }
        plotData.label = plotData.label?.trim() || null,
        plotData.updated_at = new Date();
        const updatedPlot = await plot.update(plotData);

        const filters: FilterItem[] = [{ columnField: 'id', operatorValue: 'equals', value: updatedPlot.id.toString() }];
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
            label: plotData.label?.trim() || null,
            accessibility_status: plotData.accessibility_status || null,
            pit_count: plotData.pit_count || null,
            notes: plotData.notes || null,
            created_at: new Date(),
            updated_at: new Date()
        };
        const plot = await Plot.create(obj);

        const filters: FilterItem[] = [{ columnField: 'id', operatorValue: 'equals', value: plot.id.toString() }];
        const plotsResp = await this.getPlots(0, 1, filters);
        return plotsResp.results[0] || plot;
    }

    public static async getPlots(offset: number = 0, limit: number = 10, filters: FilterItem[], orderBy?: { column: string, order: "ASC" | "DESC" }[]): Promise<PaginatedResponse<Plot>> {

        let whereCondition = "";
        let replacements: any = {}
        if (filters && filters.length > 0) {
            filters.forEach(filter => {
                let columnField = "p." + filter.columnField
                if (filter.columnField === 'site_name' && filter.operatorValue === 'isEmpty') columnField = 'p.site_id';
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
            END) AS unbooked_assigned,
            SUM(CASE 
                WHEN pt.habit = 'Tree'
                THEN 1
                ELSE 0
            END) AS tree_count,
            SUM(CASE 
                WHEN pt.habit = 'Shrub'
                THEN 1
                ELSE 0
            END) AS shrub_count,
            SUM(CASE 
                WHEN pt.habit = 'Herb'
                THEN 1
                ELSE 0
            END) AS herb_count,
            SUM(CASE 
            WHEN pt.habit = 'Climber'
            THEN 1
            ELSE 0
            END) AS climber_count,
            SUM(CASE 
                WHEN t.assigned_to IS NOT NULL 
                    AND pt.habit = 'Tree'
                THEN 1 
                ELSE 0 
            END) as assigned_trees,
            SUM(CASE 
                WHEN (t.mapped_to_user IS NOT NULL 
                    OR t.mapped_to_group IS NOT NULL) AND pt.habit = 'Tree'
                THEN 1 
                ELSE 0 
            END) AS booked_trees,
            SUM(CASE 
                WHEN (t.mapped_to_user IS NULL 
                    AND t.mapped_to_group IS NULL
                    AND t.assigned_to IS NOT NULL) AND pt.habit = 'Tree'
                THEN 1 
                ELSE 0 
            END) AS unbooked_assigned_trees,
            SUM(CASE 
                WHEN (t.mapped_to_user IS NULL 
                    AND t.mapped_to_group IS NULL 
                    AND t.assigned_to IS NULL 
                    AND t.id IS NOT NULL) AND pt.habit = 'Tree'
                    AND ppt.sustainable = true
                THEN 1 
                ELSE 0 
            END) AS available_trees,
            SUM(CASE 
                WHEN t.mapped_to_user IS NULL 
                    AND t.mapped_to_group IS NULL 
                    AND t.assigned_to IS NULL 
                    AND t.id IS NOT NULL
                    AND (t.tree_status IS NULL OR (t.tree_status != 'dead' AND t.tree_status != 'lost'))
                    AND pt.habit = 'Tree'
                    AND ptct.plant_type IS NOT NULL
                    AND ppt.sustainable = true
                THEN 1 
                ELSE 0 
            END) AS card_available_trees,
            SUM(CASE 
                WHEN t.assigned_to IS NOT NULL 
                    AND pt.habit = 'Herb'
                THEN 1 
                ELSE 0 
            END) as assigned_herbs,
            SUM(CASE 
                WHEN (t.mapped_to_user IS NOT NULL 
                    OR t.mapped_to_group IS NOT NULL) AND pt.habit = 'Herb'
                THEN 1 
                ELSE 0 
            END) AS booked_herbs,
            SUM(CASE 
                WHEN (t.mapped_to_user IS NULL 
                    AND t.mapped_to_group IS NULL
                    AND t.assigned_to IS NOT NULL) AND pt.habit = 'Herb'
                THEN 1 
                ELSE 0 
            END) AS unbooked_assigned_herbs,
            SUM(CASE 
                WHEN (t.mapped_to_user IS NULL 
                    AND t.mapped_to_group IS NULL 
                    AND t.assigned_to IS NULL 
                    AND t.id IS NOT NULL) AND pt.habit = 'Herb'
                    AND ppt.sustainable = true
                THEN 1 
                ELSE 0 
            END) AS available_herbs,
            SUM(CASE 
                WHEN t.mapped_to_user IS NULL 
                    AND t.mapped_to_group IS NULL 
                    AND t.assigned_to IS NULL 
                    AND t.id IS NOT NULL
                    AND (t.tree_status IS NULL OR (t.tree_status != 'dead' AND t.tree_status != 'lost'))
                    AND pt.habit = 'Herb'
                    AND ptct.plant_type IS NOT NULL
                    AND ppt.sustainable = true
                THEN 1 
                ELSE 0 
            END) AS card_available_herbs,
            SUM(CASE 
                WHEN t.assigned_to IS NOT NULL 
                    AND pt.habit = 'Shrub'
                THEN 1 
                ELSE 0 
            END) as assigned_shrubs,
            SUM(CASE 
                WHEN (t.mapped_to_user IS NOT NULL 
                    OR t.mapped_to_group IS NOT NULL) AND pt.habit = 'Shrub'
                THEN 1 
                ELSE 0 
            END) AS booked_shrubs,
            SUM(CASE 
                WHEN (t.mapped_to_user IS NULL 
                    AND t.mapped_to_group IS NULL
                    AND t.assigned_to IS NOT NULL) AND pt.habit = 'Shrub'
                THEN 1 
                ELSE 0 
            END) AS unbooked_assigned_shrubs,
            SUM(CASE 
                WHEN (t.mapped_to_user IS NULL 
                    AND t.mapped_to_group IS NULL 
                    AND t.assigned_to IS NULL 
                    AND t.id IS NOT NULL) AND pt.habit = 'Shrub'
                    AND ppt.sustainable = true
                THEN 1 
                ELSE 0 
            END) AS available_shrubs,
            SUM(CASE 
                WHEN t.mapped_to_user IS NULL 
                    AND t.mapped_to_group IS NULL 
                    AND t.assigned_to IS NULL 
                    AND t.id IS NOT NULL
                    AND (t.tree_status IS NULL OR (t.tree_status != 'dead' AND t.tree_status != 'lost'))
                    AND pt.habit = 'Shrub'
                    AND ptct.plant_type IS NOT NULL
                    AND ppt.sustainable = true
                THEN 1 
                ELSE 0 
            END) AS card_available_shrubs,
            SUM(CASE 
                WHEN t.assigned_to IS NOT NULL 
                  AND pt.habit = 'Climber'
                THEN 1 
                ELSE 0 
            END) as assigned_climbers,
            SUM(CASE 
                WHEN (t.mapped_to_user IS NOT NULL 
                  OR t.mapped_to_group IS NOT NULL) AND pt.habit = 'Climber'
                THEN 1 
                ELSE 0 
            END) AS booked_climbers,
            SUM(CASE 
                WHEN (t.mapped_to_user IS NULL 
                  AND t.mapped_to_group IS NULL
                  AND t.assigned_to IS NOT NULL) AND pt.habit = 'Climber'
               THEN 1 
               ELSE 0 
            END) AS unbooked_assigned_climbers,
            SUM(CASE 
                WHEN (t.mapped_to_user IS NULL 
                  AND t.mapped_to_group IS NULL 
                  AND t.assigned_to IS NULL 
                  AND t.id IS NOT NULL) AND pt.habit = 'Climber'
                  AND ppt.sustainable = true
                THEN 1 
                ELSE 0 
            END) AS available_climbers,
            SUM(CASE 
                WHEN t.mapped_to_user IS NULL 
                  AND t.mapped_to_group IS NULL 
                  AND t.assigned_to IS NULL 
                  AND t.id IS NOT NULL
                  AND (t.tree_status IS NULL OR (t.tree_status != 'dead' AND t.tree_status != 'lost'))
                  AND pt.habit = 'Climber'
                  AND ptct.plant_type IS NOT NULL
                  AND ppt.sustainable = true
                THEN 1 
                ELSE 0 
            END) AS card_available_climbers,
            array_agg(distinct CASE 
                WHEN t.mapped_to_user IS NULL 
                    AND t.mapped_to_group IS NULL 
                    AND t.assigned_to IS NULL 
                    AND t.id IS NOT NULL
                    AND (t.tree_status IS NULL OR (t.tree_status != 'dead' AND t.tree_status != 'lost'))
                    AND pt.habit = 'Tree'
                    AND ptct.plant_type IS NOT NULL
                    AND ppt.sustainable = true
                THEN ptct.plant_type 
                ELSE NULL 
            END) AS distinct_plants
        FROM "${getSchema()}".plots p
        LEFT JOIN "${getSchema()}".sites s ON p.site_id = s.id
        LEFT JOIN "${getSchema()}".trees t ON t.plot_id = p.id
        LEFT JOIN "${getSchema()}".plant_types pt on pt.id = t.plant_type_id
        LEFT JOIN "${getSchema()}".plant_type_card_templates ptct on ptct.plant_type = pt."name"
        LEFT JOIN "${getSchema()}".plot_plant_types ppt ON ppt.plot_id = t.plot_id AND ppt.plant_type_id = t.plant_type_id
        WHERE ${whereCondition !== "" ? whereCondition : "1=1"}
        GROUP BY p.id, s.id
        ORDER BY ${orderBy && orderBy.length !== 0 ? orderBy.map(o => o.column + " " + o.order).join(", ") : 'p.id DESC'}
        OFFSET ${offset} ${limit === -1 ? "" : `LIMIT ${limit}`};
        `

        const countPlotsQuery =
            `SELECT count(*)
            FROM "${getSchema()}".plots p
            LEFT JOIN "${getSchema()}".sites s ON p.site_id = s.id
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

        return { offset: offset, total: totalResults, results: plots as Plot[] };
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
                FROM "${getSchema()}".plots p,
                unnest(p.tags) AS tag
                ORDER BY tag
                OFFSET ${offset} LIMIT ${limit};`;

        const countUniqueTagsQuery =
            `SELECT count(DISTINCT tag)
                FROM "${getSchema()}".plots p,
                unnest(p.tags) AS tag;`;

        const tagsResp: any[] = await sequelize.query(getUniqueTagsQuery, { type: QueryTypes.SELECT });
        tagsResp.forEach(r => tags.push(r.tag));

        const countResp: any[] = await sequelize.query(countUniqueTagsQuery, { type: QueryTypes.SELECT });
        const total = parseInt(countResp[0].count);
        return { offset: offset, total: total, results: tags };
    }

    public static async getDeletedPlotsFromList(plotIds: number[]): Promise<number[]> {
        const query = `SELECT num
        FROM unnest(array[:plot_ids]::int[]) AS num
        LEFT JOIN "${getSchema()}".plots AS p
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
            FROM "${getSchema()}".trees t
            LEFT JOIN "${getSchema()}".plots p ON p.id = t.plot_id
            WHERE (t.tree_status is null or t.tree_status in ('healthy', 'diseased'))
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
            FROM "${getSchema()}".plots p
            LEFT JOIN "${getSchema()}".trees t ON p.id = t.plot_id ${treeCondition !== "" ? "AND " + treeCondition : ""}
            WHERE ${whereCondition !== "" ? whereCondition : "1=1"}
            GROUP BY p.id
            ORDER BY ${orderBy && orderBy.length !== 0 ? orderBy.map(o => o.column + " " + o.order).join(", ") : 'p.id DESC'}
            OFFSET ${offset} ${limit === -1 ? "" : `LIMIT ${limit}`};
        `

        const countPlotsQuery =
            `SELECT count(*)
            FROM "${getSchema()}".plots p
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

        return { offset: offset, total: totalResults, results: plots as Plot[] };
    }

    public static async getPlotStatesForCorporate(offset: number, limit: number, groupId?: number, filters?: any[], orderBy?: SortOrder[]): Promise<PaginatedResponse<Plot>> {
        let whereCondition = "";
        let replacements: any = {}
        if (filters && filters.length > 0) {
            filters.forEach(filter => {
                let columnField = "p." + filter.columnField
                if (filter.columnField === 'site_name' && filter.operatorValue === 'isEmpty') columnField = 'p.site_id';
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
        SELECT p.id, p.name, p.tags, p.category, p.accessibility_status, p.boundaries, p.label, p.acres_area,
            s.kml_file_link,
            case 
                when s.name_english is null 
                    then s.name_marathi
                    else s.name_english 
                end site_name,
            COUNT(t.id) as total, 
            SUM(CASE 
                WHEN ${groupId ? `t.mapped_to_group = ${groupId}` : 't.mapped_to_group is NOT NULL'}
                THEN 1 
                ELSE 0 
            END) AS booked,
            SUM(CASE 
                WHEN t.mapped_to_user IS NOT NULL OR t.mapped_to_group IS NOT NULL
                THEN 1 
                ELSE 0 
            END) AS total_booked,
            SUM(CASE 
                WHEN ${groupId ? `t.mapped_to_group = ${groupId}` : 't.mapped_to_group is NOT NULL'} AND t.assigned_to IS NOT NULL
                THEN 1 
                ELSE 0 
            END) AS assigned,
            SUM(CASE 
                WHEN t.mapped_to_user IS NULL 
                    AND t.mapped_to_group IS NULL 
                    AND t.assigned_to IS NULL 
                    AND t.id IS NOT NULL
                    AND ppt.sustainable = true
                THEN 1 
                ELSE 0 
            END) AS available,
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
            END) AS card_available
        FROM "${getSchema()}".plots p
        LEFT JOIN "${getSchema()}".sites s ON p.site_id = s.id
        LEFT JOIN "${getSchema()}".trees t ON t.plot_id = p.id
        LEFT JOIN "${getSchema()}".plant_types pt on pt.id = t.plant_type_id
        LEFT JOIN "${getSchema()}".plant_type_card_templates ptct on ptct.plant_type = pt."name"
        LEFT JOIN "${getSchema()}".plot_plant_types ppt ON ppt.plot_id = t.plot_id AND ppt.plant_type_id = t.plant_type_id
        WHERE ${whereCondition !== "" ? whereCondition : "1=1"}
        GROUP BY p.id, s.id
        HAVING SUM(CASE 
            WHEN ${groupId ? `t.mapped_to_group = ${groupId}` : 't.mapped_to_group is NOT NULL'}
            THEN 1 
            ELSE 0 
        END) > 0
        ORDER BY ${orderBy && orderBy.length !== 0 ? orderBy.map(o => o.column + " " + o.order).join(", ") : 'p.id DESC'}
        OFFSET ${offset} ${limit === -1 ? "" : `LIMIT ${limit}`};
        `

        const countPlotsQuery =
            `SELECT count(distinct p.id)
            FROM "${getSchema()}".plots p
            LEFT JOIN "${getSchema()}".sites s ON p.site_id = s.id
            LEFT JOIN "${getSchema()}".trees t ON t.plot_id = p.id
            WHERE ${groupId ? `t.mapped_to_group = ${groupId}` : 't.mapped_to_group is NOT NULL'} AND ${whereCondition !== "" ? whereCondition : "1=1"};
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

        return { offset: offset, total: totalResults, results: plots as Plot[] };
    }

    ///*** CSR Queries ***/
    public static async getCSRTreesAnalysis(groupId?: number): Promise<any> {

        const query = `SELECT
                count(t.id) as sponsored_trees,
                sum(case when t.assigned_to is not null then 1 else 0 end) as assigned_trees,
                count(distinct t.plant_type_id) as plant_types
            FROM "${getSchema()}".trees t
            JOIN "${getSchema()}".plots p ON p.id = t.plot_id
            JOIN "${getSchema()}".groups g on g.id = t.mapped_to_group
            WHERE ${groupId ? `g.id = ${groupId}` : `1 = 1`}
        `

        const resp = await sequelize.query(query, {
            type: QueryTypes.SELECT
        })

        const areaQuery = `
            SELECT SUM(COALESCE(p.acres_area, 0)) as area
            FROM "${getSchema()}".plots p
            WHERE p.id IN (SELECT distinct t.plot_id 
                FROM "${getSchema()}".trees t
                WHERE ${groupId ? `t.mapped_to_group = ${groupId}` : `t.mapped_to_group IS NOT NULL`})
        `

        const resp2 = await sequelize.query(areaQuery, {
            type: QueryTypes.SELECT
        })

        return {
            ...resp[0],
            ...resp2[0]
        };
    }
}