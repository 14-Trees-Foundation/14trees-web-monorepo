import { Optional } from 'sequelize';
import { Table, Column, Model, DataType } from 'sequelize-typescript';

export const GiftCardRequestStatus = {
    pendingPlotSelection: 'pending_plot_selection',
    pendingAssignment: 'pending_assignment',
    pendingGiftCards: 'pending_gift_cards',
    completed: 'completed',
}

export type GiftCardRequestValidationError = 'MISSING_LOGO' | 'MISSING_USER_DETAILS'

interface GiftCardRequestAttributes {
    id: number;
    request_id: string;
    user_id: number;
    group_id: number;
    no_of_cards: number;
    is_active: boolean;
    logo_url: string | null;
    primary_message: string | null;
    secondary_message: string | null;
    event_name: string | null;
    planted_by: string | null;
    users_csv_file_url: string | null;
    logo_message: string | null;
    validation_error: GiftCardRequestValidationError | null;
    created_at: Date;
    updated_at: Date;
    status: string;
}

interface GiftCardRequestCreationAttributes
    extends Optional<GiftCardRequestAttributes, 'id' | 'logo_url' | 'event_name' | 'planted_by' | 'users_csv_file_url' | 'logo_message'> { }

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
        type: DataType.ENUM,
        allowNull: true,
        values: ['MISSING_LOGO', 'MISSING_USER_DETAILS']
    })
    validation_error!: GiftCardRequestValidationError;

    @Column({ type: DataType.DATE, allowNull: false })
    created_at!: Date;

    @Column({ type: DataType.DATE, allowNull: false })
    updated_at!: Date;
}

export { GiftCardRequest }
export type { GiftCardRequestAttributes, GiftCardRequestCreationAttributes }