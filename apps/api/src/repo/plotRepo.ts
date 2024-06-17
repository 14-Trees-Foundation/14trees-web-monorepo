import { Op, QueryTypes, WhereOptions, col, fn, literal } from 'sequelize';
import { Plot, PlotAttributes, PlotCreationAttributes } from '../models/plot'
import { FilterItem, PaginatedResponse } from '../models/pagination';
import { Tree } from '../models/tree';
import { sequelize } from '../config/postgreDB';
import { getSqlQueryExpression, getWhereOptions } from '../controllers/helper/filters';

export class PlotRepository {
    public static async updatePlot(plotData: PlotAttributes): Promise<Plot> {
        const plot = await Plot.findByPk(plotData.id);
        if (!plot) {
            throw new Error("Plot doesn't exist");
        }
        plotData.updated_at = new Date();
        const updatedPlot = await plot.update(plotData);
        return updatedPlot;
    }

    public static async addPlot(plotData: any): Promise<Plot> {
        // Check if plot type exists
        let plotExists = await Plot.findOne({ where: { plot_id: plotData.plot_id } });

        // If plot exists, return error
        if (plotExists) {
            throw new Error("plot already exists");
        }
        let obj: PlotCreationAttributes = {
            name: plotData.plot_name,
            plot_id: plotData.plot_id,
            tags: plotData.tags,
            boundaries: plotData.boundaries,
            center: plotData.center,
            gat: plotData.gat,
            status: plotData.status,
            land_type: plotData.land_type,
            category: plotData.category,
            created_at: new Date(),
            updated_at: new Date()
        };
        const plot = await Plot.create(obj);
        return plot;
    }

    public static async getPlots(offset: number = 0, limit: number = 10, filters: FilterItem[]): Promise<PaginatedResponse<Plot>> {

        let whereCondition = "";
        let whereClause = {};
        let replacements: any = {}
        if (filters && filters.length > 0) {
            filters.forEach(filter => {
                whereClause = { ...whereClause, ...getWhereOptions(filter.columnField, filter.operatorValue, filter.value) }
                const { condition, replacement } = getSqlQueryExpression("p." + filter.columnField, filter.operatorValue, filter.columnField, filter.value);
                whereCondition = whereCondition + " " + condition + " AND";
                replacements = { ...replacements, ...replacement }
            })
            whereCondition = whereCondition.substring(0, whereCondition.length - 3);
        }

        const query = `
        SELECT p.*,
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
        WHERE ${whereCondition !== "" ? whereCondition : "1=1"}
        GROUP BY p.id
        OFFSET ${offset} LIMIT ${limit};
        `
        
        const plots: any = await sequelize.query(query, {
            replacements: replacements,
            type: QueryTypes.SELECT
        })
        const count = await Plot.count({where: whereClause});
        return { offset: offset, total: count, results: plots as Plot[]};
    }

    public static async deletePlot(plotId: string): Promise<number> {
        const resp = await Plot.destroy({ where: { id: plotId } });
        return resp;
    }

    public static async plotsCount(): Promise<number> {
        return await Plot.count()
    }
}