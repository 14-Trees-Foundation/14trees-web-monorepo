import { Op, QueryTypes, WhereOptions, col, fn, literal } from 'sequelize';
import { Plot, PlotAttributes, PlotCreationAttributes } from '../models/plot'
import { FilterItem, PaginatedResponse } from '../models/pagination';
import { Tree } from '../models/tree';
import { sequelize } from '../config/postgreDB';
import { getSqlQueryExpressionString } from '../controllers/helper/filters';

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

    public static async getPlots(offset: number = 0, limit: number = 10, whereClause: WhereOptions): Promise<PaginatedResponse<Plot>> {

        const plots = await Plot.findAll({
            group: ['Plot.id'],
            attributes: [
                'id',
                'name',
                'plot_id',
                'tags',
                'boundaries',
                'center',
                'gat',
                'status',
                'land_type',
                'category',
                'created_at',
                'updated_at',
                [fn('COUNT', col('trees.id')), 'trees_count'],
                [
                    fn(
                        'SUM',
                        literal(`
                    CASE
                    WHEN trees.mapped_to_user IS NOT NULL 
                        OR trees.mapped_to_group IS NOT NULL 
                    THEN 1 
                    ELSE 0 
                    END
                `)
                    ),
                    'mapped_trees_count'
                ],
                [fn('COUNT', col('trees.assigned_to')), 'assigned_trees_count'],
                [
                    fn(
                        'SUM',
                        literal(`
                CASE
                    WHEN trees.mapped_to_user IS NULL 
                    AND trees.mapped_to_group IS NULL 
                    AND trees.assigned_to IS NULL 
                    AND trees.id IS NOT NULL
                    THEN 1 
                    ELSE 0 
                END
                `)
                    ),
                    'available_trees_count'
                ]
            ],
            include: [
                {
                    model: Tree,
                    attributes: [],
                },
            ],
            where: whereClause,
        });
        const count = await Plot.count({ where: whereClause });
        return { offset: offset, total: count, results: plots };
    }

    public static async getPlotsNew(offset: number = 0, limit: number = 10, filters: FilterItem[]): Promise<PaginatedResponse<Plot>> {

        let whereCondition = "";
        let replacement: any = {}
        if (filters && filters.length > 0) {
            filters.forEach(filter => {
                whereCondition = whereCondition + " " + getSqlQueryExpressionString("p." + filter.columnField, filter.operatorValue, filter.columnField) + " AND";
                replacement = { ...replacement, [filter.columnField]: filter.value }
            })
            whereCondition = whereCondition.substring(0, whereCondition.length - 3);
        }
        console.log(replacement)
        const query = `
        SELECT p.*,
            COUNT(t.id) as trees_count, 
            COUNT(t.assigned_to) as assigned_trees_count,
            SUM(CASE 
                WHEN t.mapped_to_user IS NOT NULL 
                    AND t.mapped_to_group IS NOT NULL
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
        
        try {
            const plots: any = await sequelize.query(query, {
                replacements: replacement,
                type: QueryTypes.SELECT
            })
            const count = await Plot.count();
            return { offset: offset, total: count, results: plots as Plot[]};
        } catch (error: any) {
            console.log(error)
            return { offset: 0, total: 0, results: [] }
        }

    }

    public static async deletePlot(plotId: string): Promise<number> {
        const resp = await Plot.destroy({ where: { id: plotId } });
        return resp;
    }

    public static async plotsCount(): Promise<number> {
        return await Plot.count()
    }
}