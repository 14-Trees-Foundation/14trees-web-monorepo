

import { AutoPrsReqPlot } from '../models/auto_prs_req_plot';

export class AutoPrsReqPlotsRepository {

    public static async getPlots(type: 'donation' | 'gift'): Promise<AutoPrsReqPlot[]> {
        return AutoPrsReqPlot.findAll({
            where: { type: type },
            order: [['id', 'ASC']]
        })
    }

    public static async createPlot(
        plotData: {
            plot_id: string;
            type: 'donation' | 'gift';
        }
    ): Promise<AutoPrsReqPlot> {
        // Check for existing plot_id + type combination
        const existing = await AutoPrsReqPlot.findOne({
            where: {
                plot_id: plotData.plot_id,
                type: plotData.type
            }
        });

        if (existing) {
            throw new Error(`Plot ${plotData.plot_id} already exists for type ${plotData.type}`);
        }

        return AutoPrsReqPlot.create({
            plot_id: parseInt(plotData.plot_id),
            type: plotData.type
        });
    }

}
