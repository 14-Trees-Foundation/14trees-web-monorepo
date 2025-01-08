import { WhereOptions } from "sequelize";
import { PlotPlantType, PlotPlantTypeAttributes, PlotPlantTypeCreationAttributes } from "../models/plot_plant_type";


export class PlotPlantTypeRepository {
    public static async getPlotPlantTypes(whereClause: WhereOptions<PlotPlantType>): Promise<PlotPlantType[]> {
        return PlotPlantType.findAll({ where: whereClause });
    }


    public static async addPlotPlantTypes(data: PlotPlantTypeCreationAttributes[]): Promise<void> {
        await PlotPlantType.bulkCreate(data, { returning: false });
    }
}