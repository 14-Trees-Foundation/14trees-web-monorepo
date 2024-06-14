import { Op, WhereOptions } from 'sequelize';
import { Plot, PlotAttributes, PlotCreationAttributes } from '../models/plot'
import { PaginatedResponse } from '../models/pagination';

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
            where: whereClause,
            offset: offset,
            limit: limit
        });
        const count = await Plot.count({ where: whereClause });
        return { offset: offset, total: count, results: plots };
    }

    public static async deletePlot(plotId: string): Promise<number> {
        const resp = await Plot.destroy({where: { id: plotId }});
        return resp;
    }

    public static async plotsCount(): Promise<number> {
        return await Plot.count()
    }
}