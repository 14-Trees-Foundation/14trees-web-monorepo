import { Optional } from 'sequelize';
import { Table, Column, Model, DataType } from 'sequelize-typescript';

interface DonationUserAttributes {
  id: number;
	user_id: number;
	donation_id: number;
  gifted_trees: number;
	created_at: Date;
	updated_at: Date;
}

interface DonationUserCreationAttributes
	extends Optional<DonationUserAttributes, 'id'> {}

@Table({ tableName: 'donation_users' })
class DonationUser extends Model<DonationUserAttributes, DonationUserCreationAttributes>
implements DonationUserAttributes {

  @Column({
    type: DataType.NUMBER,
    autoIncrement: true,
    primaryKey: true,
    unique: true
  })
  id!: number;

  @Column({
    type: DataType.NUMBER,
    allowNull: false,
  })
  user_id!: number;

  @Column({
    type: DataType.NUMBER,
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

  @Column({ type: DataType.DATE, allowNull: false })
  updated_at!: Date;
}

export { DonationUser }
export type { DonationUserAttributes, DonationUserCreationAttributes }