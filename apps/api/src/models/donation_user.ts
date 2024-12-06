import { Optional } from 'sequelize';
import { Table, Column, Model, DataType } from 'sequelize-typescript';

interface DonationUserAttributes {
  id: number;
	recipient: number;
	assignee: number;
	donation_id: number;
  gifted_trees: number;
  mail_sent: boolean | null;
  mail_error: string | null;
  profile_image_url: string | null;
	created_at: Date;
	updated_at: Date;
}

interface DonationUserCreationAttributes
	extends Optional<DonationUserAttributes, 'id' | 'mail_sent' | 'mail_error'> {}

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
  recipient!: number;

  @Column({
    type: DataType.NUMBER,
    allowNull: false,
  })
  assignee!: number;

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

  @Column({ type: DataType.BOOLEAN })
  mail_sent!: boolean | null;

  @Column({ type: DataType.STRING })
  mail_error!: string | null;

  @Column({ type: DataType.STRING })
  profile_image_url!: string | null;

  @Column({ type: DataType.DATE, allowNull: false })
  created_at!: Date;

  @Column({ type: DataType.DATE, allowNull: false })
  updated_at!: Date;
}

export { DonationUser }
export type { DonationUserAttributes, DonationUserCreationAttributes }