import { Table, Column, Model, DataType } from 'sequelize-typescript';

interface DonationEventAttributes {
	id: number;
  donation_id: number;
  group_id: number;
  user_id: number;
  total_trees: number;
  tags: string[];
	created_at: Date;
  updated_at: Date;
}

interface DonationEventCreationAttributes
	extends DonationEventAttributes {}

@Table({ tableName: 'donation_events' })
class DonationEvent extends Model<DonationEventAttributes, DonationEventCreationAttributes>
implements DonationEventAttributes {

  @Column({
    type: DataType.NUMBER,
    autoIncrement: true,
    primaryKey: true,
    allowNull: false,
  })
  id!: number;

  @Column({ type: DataType.NUMBER, allowNull: false })
  donation_id!: number;

  @Column({ type: DataType.NUMBER, allowNull: true })
  group_id!: number;

  @Column({ type: DataType.NUMBER, allowNull: true })
  user_id!: number;

  @Column({ type: DataType.NUMBER, allowNull: false })
  total_trees!: number;

  @Column({ type: DataType.ARRAY(DataType.STRING), allowNull: false })
  tags!: string[];

  @Column({ type: DataType.DATE, allowNull: false })
  created_at!: Date;

  @Column({ type: DataType.DATE, allowNull: false })
  updated_at!: Date;
}

export { DonationEvent }
export type { DonationEventAttributes, DonationEventCreationAttributes }