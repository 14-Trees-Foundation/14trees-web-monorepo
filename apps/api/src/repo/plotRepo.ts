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
        // Check if plot type exists
        let plotExists = await Plot.findOne({ where: { plot_id: plotData.plot_id } });

        // If plot exists, return error
        if (plotExists) {
            throw new Error("plot already exists");
        }
        let siteId: number | null = null;
        if (!isNaN(parseInt(plotData.site_id))) {
            siteId = parseInt(plotData.site_id);
        }
        let obj: PlotCreationAttributes = {
            name: plotData.plot_name,
            plot_id: plotData.plot_id,
            tags: plotData.tags,
            // boundaries: plotData.boundaries,
            // center: plotData.center,
            gat: plotData.gat,
            category: plotData.category,
            site_id: siteId,
            label: plotData.label,
            accessibility_status: plotData.accessibility_status,
            created_at: new Date(),
            updated_at: new Date()
        };
        const plot = await Plot.create(obj);
        
        const filters: FilterItem[] = [{ columnField: 'id', operatorValue: 'equals', value: plot.id.toString()}];
        const plotsResp = await this.getPlots(0, 1, filters);
        return plotsResp.results[0] || plot;
    }

    public static async getPlots(offset: number = 0, limit: number = 10, filters: FilterItem[]): Promise<PaginatedResponse<Plot>> {

        let whereCondition = "";
        let replacements: any = {}
        if (filters && filters.length > 0) {
            filters.forEach(filter => {
                let columnField = "p." + filter.columnField
                if (filter.columnField === 'site_name') columnField = 's.name_english';
                const { condition, replacement } = getSqlQueryExpression(columnField, filter.operatorValue, filter.columnField, filter.value);
                whereCondition = whereCondition + " " + condition + " AND";
                replacements = { ...replacements, ...replacement }
            })
            whereCondition = whereCondition.substring(0, whereCondition.length - 3);
        }

        const query = `
        SELECT p.*,
            s.name_english as site_name,
            COUNT(t.id) as trees_count, 
            COUNT(t.assigned_to) as assigned_trees_count,
            SUM(CASE 
                WHEN t.mapped_to_user IS NOT NULL 
                    OR t.mapped_to_group IS NOT NULL
                THEN 1 
                ELSE 0 
               END) AS mapped_trees_count,
            SUM(CASE 
                WHEN t.mapped_to_user IS NULL 
                    AND t.mapped_to_group IS NULL 
                    AND t.assigned_to IS NULL 
                    AND t.id IS NOT NULL
                THEN 1 
                ELSE 0 
               END) AS available_trees_count
        FROM "14trees".plots p
        LEFT JOIN "14trees".trees t ON p.id = t.plot_id
        LEFT JOIN "14trees".sites s ON p.site_id = s.id
        WHERE ${whereCondition !== "" ? whereCondition : "1=1"}
        GROUP BY p.id, s.name_english
        ORDER BY p.id DESC
        OFFSET ${offset} ${limit === -1 ? "" : `LIMIT ${limit}`};
        `

        const countPlotsQuery = 
            `SELECT count(p.id)
                FROM "14trees".plots AS p
                LEFT JOIN "14trees".sites s ON p.site_id = s.id
                WHERE ${whereCondition !== "" ? whereCondition : "1=1"};`
        
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
                FROM "14trees".plots p,
                unnest(p.tags) AS tag
                ORDER BY tag
                OFFSET ${offset} LIMIT ${limit};`;

        const countUniqueTagsQuery = 
            `SELECT count(DISTINCT tag)
                FROM "14trees".plots p,
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
        LEFT JOIN "14trees".plots AS p
        ON num = p.id
        WHERE p.id IS NULL;`
    
        const result = await sequelize.query(query, {
            replacements: { plot_ids: plotIds },
            type: QueryTypes.SELECT
        })
    
        return result.map((row: any) => row.num);
    }
}