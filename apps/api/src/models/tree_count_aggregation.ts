import { Optional } from 'sequelize';
import { Table, Column, Model, DataType } from 'sequelize-typescript';

interface TreeCountAggregationAttributes {
    id: number;
    plot_id: number;
    total: number;
    booked: number;
    assigned: number;
    available: number;
    void_total: number;
    void_booked: number;
    void_assigned: number;
    void_available: number;
    card_available: number;
    updated_at: Date;
}

interface TreeCountAggregationCreationAttributes
    extends Optional<TreeCountAggregationAttributes, 'id'> { }

@Table({ tableName: 'tree_count_aggregations' })
class TreeCountAggregation extends Model<TreeCountAggregationAttributes, TreeCountAggregationCreationAttributes>
    implements TreeCountAggregationAttributes {

    @Column({
        type: DataType.INTEGER,
        autoIncrement: true,
        primaryKey: true,
    })
    id!: number;

    @Column({ 
        type: DataType.NUMBER,
        allowNull: false,
        unique: true
    })
    plot_id!: number;

    @Column({ type: DataType.NUMBER, allowNull: false })
    total!: number;

    @Column({ type: DataType.NUMBER, allowNull: false })
    booked!: number;

    @Column({ type: DataType.NUMBER, allowNull: false })
    assigned!: number;

    @Column({ type: DataType.NUMBER, allowNull: false })
    available!: number;

    @Column({ type: DataType.NUMBER, allowNull: false })
    void_total!: number;

    @Column({ type: DataType.NUMBER, allowNull: false })
    void_booked!: number;

    @Column({ type: DataType.NUMBER, allowNull: false })
    void_assigned!: number;

    @Column({ type: DataType.NUMBER, allowNull: false })
    void_available!: number;

    @Column({ type: DataType.NUMBER, allowNull: false })
    card_available!: number;

    @Column({ type: DataType.DATE, allowNull: false })
    updated_at!: Date;

}

export { TreeCountAggregation }
export type { TreeCountAggregationAttributes, TreeCountAggregationCreationAttributes }
