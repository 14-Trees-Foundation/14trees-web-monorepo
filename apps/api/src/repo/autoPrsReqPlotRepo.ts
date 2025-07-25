

import { Op } from 'sequelize';
import { AutoPrsReqPlot } from '../models/auto_prs_req_plot';

export class AutoPrsReqPlotsRepository {

    public static async getPlots(type: 'donation' | 'gift'): Promise<AutoPrsReqPlot[]> {
        return AutoPrsReqPlot.findAll({
            where: { type: type },
            order: [['sequence', 'ASC'], ['id', 'ASC']]
        })
    }

    public static async addPlots(
        plotData: {
            plot_ids: number[];
            type: 'donation' | 'gift';
        }
    ): Promise<AutoPrsReqPlot[]> {

        const existing = await AutoPrsReqPlot.findAll({
            where: {
                plot_id: { [Op.in]: plotData.plot_ids },
                type: plotData.type
            }
        });

        const newPlotIds = plotData.plot_ids.filter(id =>
            !existing.some(plot => plot.plot_id === id && plot.type === plotData.type)
        );

        const createData = newPlotIds.map(plot_id => ({
            plot_id,
            type: plotData.type
        }));

        if (createData.length === 0) return existing;
        return AutoPrsReqPlot.bulkCreate(createData, { returning: true });
    }

    public static async removePlots(
        plotData: {
            plot_ids: number[];
            type: 'donation' | 'gift';
        }
    ): Promise<number> {
        const deletedCount = await AutoPrsReqPlot.destroy({
            where: {
                plot_id: { [Op.in]: plotData.plot_ids },
                type: plotData.type
            }
        });

        return deletedCount;
    }

    public static async removeAllPlots(type: 'donation' | 'gift'): Promise<number> {
        const deletedCount = await AutoPrsReqPlot.destroy({
            where: {
                type: type
            }
        });

        return deletedCount;
    }

    public static async updatePlotSequences(
        plotData: {
            plot_sequences: { id: number; sequence: number }[];
            type: 'donation' | 'gift';
        }
    ): Promise<number> {
        let updatedCount = 0;

        // Update each plot sequence individually
        for (const { id, sequence } of plotData.plot_sequences) {
            const [affectedRows] = await AutoPrsReqPlot.update(
                { sequence: sequence },
                {
                    where: {
                        plot_id: id,
                        type: plotData.type
                    }
                }
            );
            updatedCount += affectedRows;
        }

        return updatedCount;
    }
}
