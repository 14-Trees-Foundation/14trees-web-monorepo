
import { Optional } from 'sequelize';
import { Table, Column, Model, DataType } from 'sequelize-typescript';

interface ReferralAttributes {
    id: number;
    rfr: string | null;
    c_key: string | null;
    created_at: Date;
    updated_at: Date;
}

interface ReferralCreationAttributes
    extends Optional<ReferralAttributes, 'id' | 'created_at' | 'updated_at'> { }

@Table({ tableName: 'referrals' })
class Referral extends Model<ReferralAttributes, ReferralCreationAttributes>
    implements ReferralAttributes {

    @Column({
        type: DataType.NUMBER,
        autoIncrement: true,
        primaryKey: true,
        unique: true
    })
    id!: number;

    @Column({
        type: DataType.STRING,
        allowNull: true,
    })
    rfr!: string | null;

    @Column({
        type: DataType.STRING,
        allowNull: true,
        unique: true
    })
    c_key!: string | null;

    @Column({ type: DataType.DATE, allowNull: false, defaultValue: DataType.NOW })
    created_at!: Date;

    @Column({ type: DataType.DATE, allowNull: false, defaultValue: DataType.NOW })
    updated_at!: Date;
}

export { Referral }
export type { ReferralAttributes, ReferralCreationAttributes }