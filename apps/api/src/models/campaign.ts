
import { Optional } from 'sequelize';
import { Table, Column, Model, DataType } from 'sequelize-typescript';

interface CampaignAttributes {
    id: number;
    name: string;
    c_key: string;
    description: string | null;
    created_at: Date;
    updated_at: Date;
}

interface CampaignCreationAttributes
    extends Optional<CampaignAttributes, 'id' | 'created_at' | 'updated_at'> { }

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

    @Column({ type: DataType.DATE, allowNull: false })
    created_at!: Date;

    @Column({ type: DataType.DATE, allowNull: false })
    updated_at!: Date;
}

export { Campaign }
export type { CampaignAttributes, CampaignCreationAttributes }