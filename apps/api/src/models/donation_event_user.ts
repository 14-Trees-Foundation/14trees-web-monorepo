import { Table, Column, Model, DataType } from 'sequelize-typescript';

interface DonationEventUserAttributes {
	user_id: number;
	donation_event_id: number;
    gifted_trees: number;
	created_at: Date;
}

interface DonationEventUserCreationAttributes
	extends DonationEventUserAttributes {}

@Table({ tableName: 'donation_event_users' })
class DonationEventUser extends Model<DonationEventUserAttributes, DonationEventUserCreationAttributes>
implements DonationEventUserAttributes {

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
  donation_event_id!: number;

  @Column({
    type: DataType.NUMBER,
    allowNull: false,
  })
  gifted_trees!: number;

  @Column({ type: DataType.DATE, allowNull: false })
  created_at!: Date;
}

export { DonationEventUser }
export type { DonationEventUserAttributes, DonationEventUserCreationAttributes }