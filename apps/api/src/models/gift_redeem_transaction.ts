import { Optional } from 'sequelize';
import { Table, Column, Model, DataType } from 'sequelize-typescript';

interface GiftRedeemTransactionAttributes {
    id: number;
    created_by: number,
    modified_by: number,
    recipient: number,
    primary_message: string;
    secondary_message: string;
    logo_message: string;
    occasion_name: string | null;
    occasion_type: string | null;
    gifted_by: string | null;
    gifted_on: Date;
    created_at: Date;
    updated_at: Date;
}

interface GiftRedeemTransactionCreationAttributes
    extends Optional<GiftRedeemTransactionAttributes, 'id'> { }

@Table({ tableName: 'gift_redeem_transactions' })
class GiftRedeemTransaction extends Model<GiftRedeemTransactionAttributes, GiftRedeemTransactionCreationAttributes>
    implements GiftRedeemTransactionAttributes {

    @Column({
        type: DataType.NUMBER,
        primaryKey: true,
        autoIncrement: true,
    })
    id!: number;

    @Column({
        type: DataType.INTEGER,
    })
    created_by!: number;

    @Column({
        type: DataType.INTEGER,
    })
    modified_by!: number;


    @Column({
        type: DataType.INTEGER,
    })
    recipient!: number;

    @Column({
        type: DataType.STRING,
    })
    primary_message!: string;

    @Column({
        type: DataType.STRING,
    })
    secondary_message!: string;

    @Column({
        type: DataType.STRING,
    })
    logo_message!: string;

    @Column({
        type: DataType.STRING,
    })
    occasion_name!: string | null;

    @Column({
        type: DataType.STRING,
    })
    occasion_type!: string | null;

    @Column({
        type: DataType.STRING,
    })
    gifted_by!: string | null;

    @Column({ type: DataType.DATE, allowNull: false })
    gifted_on!: Date;

    @Column({ type: DataType.DATE, allowNull: false })
    created_at!: Date;

    @Column({ type: DataType.DATE, allowNull: false })
    updated_at!: Date;
}

interface GRTCardAttributes {
    gc_id: number,
    grt_id: number,
    created_at: Date;
}

interface GRTCardCreationAttributes
    extends GRTCardAttributes { }

@Table({ tableName: 'gift_redeem_transaction_cards' })
class GRTCard extends Model<GRTCardAttributes, GRTCardCreationAttributes>
    implements GRTCardAttributes {

    @Column({
        type: DataType.NUMBER,
        primaryKey: true,
    })
    gc_id!: number;

    @Column({
        type: DataType.NUMBER,
        allowNull: false,
    })
    grt_id!: number;

    @Column({ type: DataType.DATE, allowNull: false })
    created_at!: Date;
}

export { GiftRedeemTransaction, GRTCard }
export type { GiftRedeemTransactionAttributes, GiftRedeemTransactionCreationAttributes, GRTCardAttributes, GRTCardCreationAttributes }