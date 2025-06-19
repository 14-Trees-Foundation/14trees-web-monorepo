import { Optional } from 'sequelize';
import { Table, Column, Model, DataType } from 'sequelize-typescript';

interface GiftRequestUserAttributes {
    id: number;
    recipient: number;
    assignee: number;
    gift_request_id: number;
    gifted_trees: number;
    profile_image_url: string | null;
    mail_sent: boolean | null;
    mail_error: string | null;
    mail_sent_assignee: boolean | null; 
    mail_error_assignee: string | null;
    gifted_on: Date | null;
    gifted_by: string | null;
    event_name: string | null;
    created_at: Date;
    updated_at: Date;
}

interface GiftRequestUserCreationAttributes
    extends Optional<GiftRequestUserAttributes, 'id' | 'profile_image_url' | 'mail_error' | 'mail_sent' | 'gifted_by' | 'gifted_on' | 'event_name' | 'mail_sent_assignee' | 'mail_error_assignee'> { }

@Table({ tableName: 'gift_request_users' })
class GiftRequestUser extends Model<GiftRequestUserAttributes, GiftRequestUserCreationAttributes>
    implements GiftRequestUserAttributes {

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
    recipient!: number;

    @Column({
        type: DataType.NUMBER,
    })
    assignee!: number;

    @Column({
        type: DataType.NUMBER,
        allowNull: false,
    })
    gift_request_id!: number;

    @Column({
        type: DataType.NUMBER,
        allowNull: false,
    })
    gifted_trees!: number;

    @Column({
        type: DataType.STRING,
    })
    profile_image_url!: string | null;

    @Column({
        type: DataType.DATE,
        allowNull: true,
    })
    gifted_on!: Date | null;

    @Column({
        type: DataType.STRING,
        allowNull: true,
    })
    gifted_by!: string | null;

    @Column({
        type: DataType.STRING,
        allowNull: true,
    })
    event_name!: string | null;

    @Column({
        type: DataType.BOOLEAN,
    })
    mail_sent!: boolean;

    @Column({
        type: DataType.STRING,
    })
    mail_error!: string;

    @Column({
        type: DataType.BOOLEAN,
        allowNull: true,
    })
    mail_sent_assignee!: boolean | null;

    @Column({
        type: DataType.STRING,
        allowNull: true,
    })
    mail_error_assignee!: string | null;

    @Column({ type: DataType.DATE, allowNull: false })
    created_at!: Date;

    @Column({ type: DataType.DATE, allowNull: false })
    updated_at!: Date;
}

export { GiftRequestUser }
export type { GiftRequestUserAttributes, GiftRequestUserCreationAttributes }