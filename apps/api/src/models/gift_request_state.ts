

import { Optional } from 'sequelize';
import { Table, Column, Model, DataType } from 'sequelize-typescript';

interface GiftRequestStateAttributes {
    id: number;
    status: string;
    data: any,
    gift_request_id: number;
    created_at: Date;
    updated_at: Date;
}

interface GiftRequestStateCreationAttributes
    extends Optional<GiftRequestStateAttributes, 'id'> { }

@Table({ tableName: 'gift_request_states' })
class GiftRequestState extends Model<GiftRequestStateAttributes, GiftRequestStateCreationAttributes>
    implements GiftRequestStateAttributes {

    @Column({
        type: DataType.NUMBER,
        allowNull: false,
        primaryKey: true,
        autoIncrement: true,
        unique: true
    })
    id!: number;

    @Column({
        type: DataType.STRING,
        allowNull: false,
    })
    status!: string;

    @Column({type: DataType.JSON})
    data!: any;

    @Column({
        type: DataType.NUMBER,
        allowNull: false,
    })
    gift_request_id!: number;

    @Column({ type: DataType.DATE, allowNull: false })
    created_at!: Date;

    @Column({ type: DataType.DATE, allowNull: false })
    updated_at!: Date;
}

export { GiftRequestState }
export type { GiftRequestStateAttributes, GiftRequestStateCreationAttributes }