import { Optional } from 'sequelize';
import { Table, Column, Model, DataType } from 'sequelize-typescript';

interface GiftCardUserAttributes {
    id: number;
    user_id: number | null;
    card_id: number;
    tree_id: number | null;
    card_image_url: string | null;
    created_at: Date;
    updated_at: Date;
}

interface GiftCardUserCreationAttributes
    extends Optional<GiftCardUserAttributes, 'id' | 'tree_id' | 'card_image_url'> { }

@Table({ tableName: 'gift_card_users' })
class GiftCardUser extends Model<GiftCardUserAttributes, GiftCardUserCreationAttributes>
    implements GiftCardUserAttributes {

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
        allowNull: false,
    })
    card_id!: number;

    @Column({
        type: DataType.NUMBER,
    })
    tree_id!: number;

    @Column({
        type: DataType.STRING,
    })
    card_image_url!: string;

    @Column({ type: DataType.DATE, allowNull: false })
    created_at!: Date;

    @Column({ type: DataType.DATE, allowNull: false })
    updated_at!: Date;
}

export { GiftCardUser }
export type { GiftCardUserAttributes, GiftCardUserCreationAttributes }