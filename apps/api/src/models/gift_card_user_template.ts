import { Table, Column, Model, DataType } from 'sequelize-typescript';

interface GiftCardUserTemplateAttributes {
    gift_card_id: number;
    template_id: string;
    created_at: Date;
}

interface GiftCardUserTemplateCreationAttributes
    extends GiftCardUserTemplateAttributes{ }

@Table({ tableName: 'gift_card_user_templates' })
class GiftCardUserTemplate extends Model<GiftCardUserTemplateAttributes, GiftCardUserTemplateCreationAttributes>
    implements GiftCardUserTemplateAttributes {

    @Column({
        type: DataType.NUMBER,
        primaryKey: true,
        allowNull: false,
    })
    gift_card_id!: number;

    @Column({
        type: DataType.STRING,
        allowNull: false,
    })
    template_id!: string;

    @Column({ type: DataType.DATE, allowNull: false })
    created_at!: Date;
}

export { GiftCardUserTemplate }
export type { GiftCardUserTemplateAttributes, GiftCardUserTemplateCreationAttributes }