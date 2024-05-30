import { Op } from 'sequelize';
import { Plot, PlotAttributes, PlotCreationAttributes } from '../models/plot'

export class PlotRepository {
    public static async updatePlot(plotData: PlotAttributes): Promise<Plot> {
        const plot = await Plot.findByPk(plotData.id);
        if (!plot) {
            throw new Error("Plot doesn't exist");
        }
        const updatedPlot = plot.update(plotData);
        return updatedPlot;
    }

    public static async addPlot( plotData: any): Promise<Plot> {
        // Check if plot type exists
        let plotExists = await Plot.findOne({ where: { plot_id: plotData.plot_code } });

        // If plot exists, return error
        if (plotExists) {
            throw new Error("plot already exists");
        }
        let obj: PlotCreationAttributes = {
            name: plotData.plot_name,
            plot_id: plotData.plot_code,
            boundaries: plotData.boundaries,
            center: plotData.center,
        };
        const plot = Plot.create(obj);
        return plot;
    }

    public static async getPlots(name?: string, offset: number = 0, limit: number = 10): Promise<Plot[]> {
        const whereClause: Record<string, any> = {};
        if (name) {
            whereClause["name"] = { [ Op.iLike]: `%${name}%` };
        }
        const result = await Plot.findAll({
            where: whereClause,
            offset: offset,
            limit: limit
        });
        return result;
    }

    public static async deletePlot(plotId: string): Promise<number> {
        const resp = await Plot.destroy({where: { id: plotId }});
        return resp;
    }

    public static async plotCount(): Promise<number> {
        return await Plot.count()
    }
}