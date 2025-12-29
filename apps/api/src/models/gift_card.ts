import { Optional } from 'sequelize';
import { Table, Column, Model, DataType } from 'sequelize-typescript';

interface GiftCardAttributes {
    id: number;
    gifted_to: number | null;
    assigned_to: number | null;
    gift_card_request_id: number;
    gift_request_user_id: number | null;
    tree_id: number | null;
    card_image_url: string | null;
    profile_image_url: string | null;
    mail_sent: boolean | null;
    mail_error: string | null;
    presentation_id: string | null;
    slide_id: string | null;
    created_at: Date;
    updated_at: Date;
}

interface GiftCardCreationAttributes
    extends Optional<GiftCardAttributes, 'id' | 'tree_id' | 'card_image_url' | 'profile_image_url' | 'mail_error' | 'mail_sent' | 'slide_id' | 'presentation_id' > { }

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
    })
    gifted_to!: number | null;

    @Column({
        type: DataType.NUMBER,
    })
    assigned_to!: number | null;

    @Column({
        type: DataType.NUMBER,
        allowNull: false,
    })
    gift_card_request_id!: number;

    @Column({
        type: DataType.NUMBER,
    })
    gift_request_user_id!: number | null;

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
    profile_image_url!: string | null;

    @Column({
        type: DataType.BOOLEAN,
    })
    mail_sent!: boolean;

    @Column({
        type: DataType.STRING,
    })
    mail_error!: string;

    @Column({
        type: DataType.STRING,
    })
    slide_id!: string | null;

    @Column({
        type: DataType.STRING,
    })
    presentation_id!: string | null;

    @Column({ type: DataType.DATE, allowNull: false })
    created_at!: Date;

    @Column({ type: DataType.DATE, allowNull: false })
    updated_at!: Date;
}

export { GiftCard }
export type { GiftCardAttributes, GiftCardCreationAttributes }