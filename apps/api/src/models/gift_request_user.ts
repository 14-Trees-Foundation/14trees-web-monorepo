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

// Input type for upsertGiftRequestUsers API
interface GiftRequestUserInput {
    id?: number; // Optional for updates
    recipient_name: string;
    recipient_phone: string;
    recipient_email: string;
    recipient_communication_email: string;
    assignee_name: string;
    assignee_phone: string;
    assignee_email: string;
    assignee_communication_email: string;
    gifted_trees: string; // Comes as string from frontend
    tree_id?: string; // Optional tree assignment
    recipient?: number; // Optional existing user ID
    assignee?: number; // Optional existing user ID
    relation?: string; // Optional relationship between recipient and assignee
    image_url?: string; // Optional profile image
    gifted_by?: string; // Optional gifted by information
    gifted_on?: Date; // Optional gift date
    event_name?: string; // Optional event name
    mail_sent?: boolean; // Optional mail status
    mail_error?: string; // Optional mail error
    mail_sent_assignee?: boolean; // Optional assignee mail status
    mail_error_assignee?: string; // Optional assignee mail error
}

export { GiftRequestUser }
export type { GiftRequestUserAttributes, GiftRequestUserCreationAttributes, GiftRequestUserInput }