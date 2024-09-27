import { Optional } from 'sequelize';
import { Table, Column, Model, DataType } from 'sequelize-typescript';

interface GiftCardAttributes {
    id: number;
    user_id: number;
    group_id: number;
    no_of_cards: number;
    is_active: boolean;
    logo_url: string | null;
    created_at: Date;
    updated_at: Date;
}

interface GiftCardCreationAttributes
    extends Optional<GiftCardAttributes, 'id' | 'logo_url'> { }

@Table({ tableName: 'gift_cards' })
class GiftCard extends Model<GiftCardAttributes, GiftCardCreationAttributes>
    implements GiftCardAttributes {

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
        type: DataType.BOOLEAN,
        allowNull: false,
    })
    is_active!: boolean;

    @Column({
        type: DataType.STRING,
    })
    logo_url!: string;

    @Column({
        type: DataType.NUMBER,
        allowNull: false,
    })
    no_of_cards!: number;

    @Column({ type: DataType.DATE, allowNull: false })
    created_at!: Date;

    @Column({ type: DataType.DATE, allowNull: false })
    updated_at!: Date;
}

export { GiftCard }
export type { GiftCardAttributes, GiftCardCreationAttributes }