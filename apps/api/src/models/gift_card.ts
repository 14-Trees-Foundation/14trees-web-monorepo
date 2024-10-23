import { Optional } from 'sequelize';
import { Table, Column, Model, DataType } from 'sequelize-typescript';

interface GiftCardAttributes {
    id: number;
    user_id: number | null;
    gift_card_request_id: number;
    tree_id: number | null;
    card_image_url: string | null;
    profile_image_url: string | null;
    mail_sent: boolean | null;
    mail_error: string | null;
    created_at: Date;
    updated_at: Date;
}

interface GiftCardCreationAttributes
    extends Optional<GiftCardAttributes, 'id' | 'tree_id' | 'card_image_url' | 'profile_image_url' | 'mail_error' | 'mail_sent'> { }

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
        allowNull: false,
    })
    gift_card_request_id!: number;

    @Column({
        type: DataType.NUMBER,
    })
    tree_id!: number;

    @Column({
        type: DataType.STRING,
    })
    card_image_url!: string;

    @Column({
        type: DataType.STRING,
    })
    profile_image_url!: string;

    @Column({
        type: DataType.BOOLEAN,
    })
    mail_sent!: boolean;

    @Column({
        type: DataType.STRING,
    })
    mail_error!: string;

    @Column({ type: DataType.DATE, allowNull: false })
    created_at!: Date;

    @Column({ type: DataType.DATE, allowNull: false })
    updated_at!: Date;
}

export { GiftCard }
export type { GiftCardAttributes, GiftCardCreationAttributes }