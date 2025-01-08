//Model in postgresql db

import { Optional } from 'sequelize';
import { Table, Column, Model, DataType } from 'sequelize-typescript';

interface PlotPlantTypeAttributes {
    id: number;
    plot_id: number;
    plant_type_id: number;
    sustainable: boolean;
    created_at: Date;
    updated_at: Date;
}

interface PlotPlantTypeCreationAttributes
    extends Optional<PlotPlantTypeAttributes, 'id' > { }

@Table({ tableName: 'plot_plant_types' })
class PlotPlantType extends Model<PlotPlantTypeAttributes, PlotPlantTypeCreationAttributes>
    implements PlotPlantTypeAttributes {

    @Column({
        type: DataType.NUMBER,
        autoIncrement: true,
        primaryKey: true,
        unique: true
    })
    id!: number;

    @Column(DataType.NUMBER)
    plot_id!: number;

    @Column(DataType.NUMBER)
    plant_type_id!: number;

    @Column(DataType.BOOLEAN)
    sustainable!: boolean;

    @Column(DataType.DATE)
    created_at!: Date;

    @Column(DataType.DATE)
    updated_at!: Date;
}

export { PlotPlantType }
export type { PlotPlantTypeAttributes, PlotPlantTypeCreationAttributes }