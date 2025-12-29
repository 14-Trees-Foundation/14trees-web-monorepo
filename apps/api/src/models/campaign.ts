
import { Optional } from 'sequelize';
import { Table, Column, Model, DataType } from 'sequelize-typescript';

export interface CampaignEmailConfig {
    sponsor_email?: {
        enabled: boolean;
        from_name: string;
        from_email?: string;
        subject_template_single: string;
        subject_template_multi: string;
        reply_to?: string;
        cc_emails: string[];
        template_name_single: string;
        template_name_multi: string;
        custom_data?: Record<string, any>;
    };
    receiver_email?: {
        enabled: boolean;
        from_name: string;
        subject_template: string;
        template_name: string;
        custom_data?: Record<string, any>;
    };
}

interface CampaignAttributes {
    id: number;
    name: string;
    c_key: string;
    description: string | null;
    email_config: CampaignEmailConfig | null;
    created_at: Date;
    updated_at: Date;
}

interface CampaignCreationAttributes
    extends Optional<CampaignAttributes, 'id' | 'created_at' | 'updated_at' | 'email_config'> { }

@Table({ tableName: 'campaigns' })
class Campaign extends Model<CampaignAttributes, CampaignCreationAttributes>
    implements CampaignAttributes {

    @Column({
        type: DataType.NUMBER,
        autoIncrement: true,
        primaryKey: true,
        unique: true
    })
    id!: number;

    @Column({
        type: DataType.STRING,
        allowNull: false,
    })
    name!: string;

    @Column({
        type: DataType.STRING,
        allowNull: false,
        unique: true
    })
    c_key!: string;

    @Column({
        type: DataType.STRING,
        allowNull: true
    })
    description!: string | null;

    @Column({
        type: DataType.JSONB,
        allowNull: true
    })
    email_config!: CampaignEmailConfig | null;

    @Column({ type: DataType.DATE, allowNull: false, defaultValue: DataType.NOW })
    created_at!: Date;

    @Column({ type: DataType.DATE, allowNull: false, defaultValue: DataType.NOW })
    updated_at!: Date;
}

export { Campaign }
export type { CampaignAttributes, CampaignCreationAttributes }