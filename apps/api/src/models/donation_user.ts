import { Table, Column, Model, DataType } from 'sequelize-typescript';

interface DonationUserAttributes {
	user_id: number;
	donation_id: number;
  gifted_trees: number;
	created_at: Date;
}

interface DonationUserCreationAttributes
	extends DonationUserAttributes {}

@Table({ tableName: 'donation_users' })
class DonationUser extends Model<DonationUserAttributes, DonationUserCreationAttributes>
implements DonationUserAttributes {

  @Column({
    type: DataType.NUMBER,
    primaryKey: true,
    allowNull: false,
  })
  user_id!: number;

  @Column({
    type: DataType.NUMBER,
    primaryKey: true,
    allowNull: false,
  })
  donation_id!: number;

  @Column({
    type: DataType.NUMBER,
    allowNull: false,
  })
  gifted_trees!: number;

  @Column({ type: DataType.DATE, allowNull: false })
  created_at!: Date;
}

export { DonationUser }
export type { DonationUserAttributes, DonationUserCreationAttributes }