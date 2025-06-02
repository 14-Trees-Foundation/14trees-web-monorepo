
import { Optional } from 'sequelize';
import { Table, Column, Model, DataType } from 'sequelize-typescript';

interface AutoPrsReqPlotAttributes {
    id: number;
    plot_id: number;
    type: 'donation' | 'gift';
    created_at: Date;
    updated_at: Date;
}


interface AutoPrsReqPlotCreationAttributes
    extends Optional<AutoPrsReqPlotAttributes, 'id' | 'created_at' | 'updated_at'> { }

@Table({ tableName: 'auto_prs_req_plots' })
class AutoPrsReqPlot
    extends Model<AutoPrsReqPlotAttributes, AutoPrsReqPlotCreationAttributes>
    implements AutoPrsReqPlotAttributes {
    @Column({
        type: DataType.NUMBER,
        autoIncrement: true,
        primaryKey: true,
    })
    id!: number;

    @Column({ type: DataType.ENUM('donation', 'gift') })
    type!: 'donation' | 'gift';

    @Column({ type: DataType.INTEGER })
    plot_id!: number;

    @Column({ type: DataType.DATE })
    created_at!: Date;

    @Column({ type: DataType.DATE })
    updated_at!: Date;
}

export { AutoPrsReqPlot }
export type { AutoPrsReqPlotAttributes, AutoPrsReqPlotCreationAttributes }