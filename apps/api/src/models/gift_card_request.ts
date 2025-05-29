import { Optional } from 'sequelize';
import { Table, Column, Model, DataType } from 'sequelize-typescript';

export const GiftCardRequestStatus = {
    pendingPlotSelection: 'pending_plot_selection',
    pendingAssignment: 'pending_assignment',
    pendingGiftCards: 'pending_gift_cards',
    completed: 'completed',
}

export type GiftCardRequestValidationError = 'MISSING_LOGO' | 'MISSING_USER_DETAILS'
export type GiftCardRequestType = 'Gift Cards' | 'Normal Assignment' | 'Visit' | 'Test' | 'Promotion'
export type SponsorshipType = 'Unverified' | 'Pledged' | 'Promotional' | 'Unsponsored Visit' | 'Donation Received'

export type GiftReqMailStatus = 'AckSent' | 'DashboardsSent' | 'BackOffice' | 'Accounts' | 'Volunteer' | 'CSR';
export const GiftReqMailStatus_AckSent: GiftReqMailStatus = 'AckSent';
export const GiftReqMailStatus_DashboardsSent: GiftReqMailStatus = 'DashboardsSent';
export const GiftReqMailStatus_BackOffice: GiftReqMailStatus = 'BackOffice';
export const GiftReqMailStatus_Accounts: GiftReqMailStatus = 'Accounts';
export const GiftReqMailStatus_Volunteer: GiftReqMailStatus = 'Volunteer';
export const GiftReqMailStatus_CSR: GiftReqMailStatus = 'CSR';

export type GiftMessages = {
    primary_message: string;
    secondary_message: string;
    logo_message: string;
    event_type: string;
    gifted_by?: string;
}

interface GiftCardRequestAttributes {
    id: number;
    request_id: string;
    user_id: number;
    sponsor_id: number | null;
    group_id: number | null;
    no_of_cards: number;
    is_active: boolean;
    logo_url: string | null;
    primary_message: string | null;
    secondary_message: string | null;
    event_name: string | null;
    event_type: string | null;
    planted_by: string | null;
    users_csv_file_url: string | null;
    logo_message: string | null;
    validation_errors: GiftCardRequestValidationError[] | null;
    created_at: Date;
    updated_at: Date;
    status: string;
    category: string;
    grove: string | null;
    presentation_id: string | null;
    notes: string | null;
    album_id: number | null;
    payment_id: number | null;
    visit_id: number | null;
    tags: string[] | null;
    gifted_on: Date;
    created_by: number;
    request_type: GiftCardRequestType | null,
    sponsorship_type: SponsorshipType,
    donation_receipt_number: string | null,
    amount_received: number | null,
    donation_date: Date | null,
    contribution_options: string[] | null,
    comments: string | null,
    mail_sent: boolean;
    mail_status: GiftReqMailStatus[] | null;
    mail_error: string | null;
    rfr_id: number | null;
}

interface GiftCardRequestCreationAttributes
    extends Optional<GiftCardRequestAttributes, 'id' | 'logo_url' | 'event_name' | 'event_type' | 'planted_by' | 'users_csv_file_url' | 'logo_message' | 'presentation_id' | 'notes' | 'album_id' | 'tags' | 'sponsorship_type' | 'amount_received' | 'donation_receipt_number' | 'donation_date' | 'contribution_options' | 'comments' | 'mail_sent' | 'mail_status' | 'mail_error' | 'rfr_id'> { }

@Table({ tableName: 'gift_card_requests' })
class GiftCardRequest extends Model<GiftCardRequestAttributes, GiftCardRequestCreationAttributes>
    implements GiftCardRequestAttributes {

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
        unique: true
    })
    request_id!: string;

    @Column({
        type: DataType.STRING,
    })
    request_type!: GiftCardRequestType | null;

    @Column({
        type: DataType.NUMBER,
        allowNull: false,
    })
    user_id!: number;

    @Column({
        type: DataType.NUMBER,
    })
    sponsor_id!: number | null;

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
    event_name!: string;

    @Column({
        type: DataType.STRING,
    })
    event_type!: string | null;

    @Column({
        type: DataType.STRING,
    })
    planted_by!: string;

    @Column({
        type: DataType.STRING,
    })
    users_csv_file_url!: string;

    @Column({
        type: DataType.STRING,
    })
    logo_message!: string;

    @Column({
        type: DataType.NUMBER,
        allowNull: false,
    })
    no_of_cards!: number;

    @Column({
        type: DataType.STRING,
    })
    status!: string;

    @Column({
        type: DataType.STRING,
    })
    category!: string;

    @Column({
        type: DataType.STRING,
    })
    grove!: string | null;

    @Column({
        type: DataType.STRING,
    })
    presentation_id!: string;

    @Column({
        type: DataType.TEXT,
    })
    notes!: string;

    @Column({
        type: DataType.INTEGER,
    })
    album_id!: number;

    @Column({
        type: DataType.INTEGER,
    })
    visit_id!: number | null;

    @Column({
        type: DataType.INTEGER,
    })
    payment_id!: number;

    @Column({
        type: DataType.ARRAY(DataType.STRING),
    })
    tags!: string[] | null;

    @Column({ type: DataType.STRING })
    sponsorship_type!: SponsorshipType;

    @Column({ type: DataType.STRING })
    donation_receipt_number!: string;

    @Column({ type: DataType.INTEGER })
    amount_received!: number;

    @Column({ type: DataType.DATE })
    donation_date!: Date | null;

    @Column({
        type: DataType.INTEGER,
    })
    created_by!: number;

    @Column({
        type: DataType.INTEGER,
        allowNull: true,
        defaultValue: null
    })
    rfr_id!: number | null;

    @Column({
        type: DataType.ARRAY(DataType.STRING),
    })
    validation_errors!: GiftCardRequestValidationError[];

    @Column({
        type: DataType.ARRAY(DataType.STRING),
        allowNull: true,
    })
    contribution_options!: string[] | null;

    @Column({
        type: DataType.TEXT,
        allowNull: true,
    })
    comments!: string | null;

    @Column({
        type: DataType.ARRAY(DataType.ENUM('AckSent', 'DashboardsSent', 'BackOffice', 'Accounts', 'Volunteer', 'CSR')),
        allowNull: true
    })
    mail_status!: GiftReqMailStatus[] | null;

    @Column({
        type: DataType.STRING,
        allowNull: true,
    })
    mail_error!: string | null;

    @Column({
        type: DataType.BOOLEAN,
        allowNull: false,
        defaultValue: false
    })
    mail_sent!: boolean;

    @Column({ type: DataType.DATE, allowNull: false })
    gifted_on!: Date;

    @Column({ type: DataType.DATE, allowNull: false })
    created_at!: Date;

    @Column({ type: DataType.DATE, allowNull: false })
    updated_at!: Date;
}

export { GiftCardRequest }
export type { GiftCardRequestAttributes, GiftCardRequestCreationAttributes }