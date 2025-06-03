

import { AutoPrsReqPlot } from '../models/auto_prs_req_plot';

export class AutoPrsReqPlotsRepository {

    public static async getPlots(type: 'donation' | 'gift'): Promise<AutoPrsReqPlot[]> {
        return AutoPrsReqPlot.findAll({
            where: { type: type },
            order: [['id', 'ASC']]
        })
    }
}
