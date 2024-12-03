import { Optional } from 'sequelize';
import { Table, Column, Model, DataType } from 'sequelize-typescript';

interface OrderAttributes {
    id: number;
    user_id: number;
    group_id: number;
    trees_count: number;
    payment_id: number | null;
    notes: string | null;
    category: string | null;
    grove: string | null;
    created_at: Date;
    updated_at: Date;
}

interface OrderCreationAttributes
    extends Optional<OrderAttributes, 'id' | 'notes'> { }

@Table({ tableName: 'orders' })
class Order extends Model<OrderAttributes, OrderCreationAttributes>
    implements OrderAttributes {

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
    user_id!: number;

    @Column({
        type: DataType.NUMBER,
    })
    group_id!: number;

    @Column({
        type: DataType.NUMBER,
        allowNull: false,
    })
    trees_count!: number;

    @Column({
        type: DataType.TEXT,
    })
    notes!: string;

    @Column({
        type: DataType.INTEGER,
    })
    payment_id!: number;

    @Column({
        type: DataType.STRING,
    })
    category!: string;

    @Column({
        type: DataType.STRING,
    })
    grove!: string;

    @Column({ type: DataType.DATE, allowNull: false })
    created_at!: Date;

    @Column({ type: DataType.DATE, allowNull: false })
    updated_at!: Date;
}

export { Order }
export type { OrderAttributes, OrderCreationAttributes }