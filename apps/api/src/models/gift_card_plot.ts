import { Optional } from 'sequelize';
import { Table, Column, Model, DataType } from 'sequelize-typescript';

interface GiftCardPlotAttributes {
    id: number;
    plot_id: number;
    card_id: number;
    created_at: Date;
}

interface GiftCardPlotCreationAttributes
    extends Optional<GiftCardPlotAttributes, 'id'> { }

@Table({ tableName: 'gift_card_plots' })
class GiftCardPlot extends Model<GiftCardPlotAttributes, GiftCardPlotCreationAttributes>
    implements GiftCardPlotAttributes {

    @Column({
        type: DataType.NUMBER,
        allowNull: false,
        primaryKey: true,
        autoIncrement: true,
        unique: true
    })
    id!: number;

    @Column({
        type: DataType.NUMBER,
        allowNull: false,
    })
    plot_id!: number;

    @Column({
        type: DataType.NUMBER,
        allowNull: false,
    })
    card_id!: number;

    @Column({ type: DataType.DATE, allowNull: false })
    created_at!: Date;
}

export { GiftCardPlot }
export type { GiftCardPlotAttributes, GiftCardPlotCreationAttributes }