//Model in postgresql db
import { Table, Column, Model, DataType } from 'sequelize-typescript';
import { Optional } from 'sequelize';

interface DonationAttributes {
  id: number;
  request_id: string | null;
  user_id: number;
  group_id: number | null;
  category: 'Public' | 'Foundation';
  grove: string | null;
  pledged: number;
  pledged_area: number;
  preference: string;
  payment_id: number | null;
  feedback: string | null;
  notes: string | null;
  associated_tag: string;
  event_name: string | null;
  alternate_email: string | null;
  source_info: string | null;
  logo: string | null;
  created_by: number;
  created_at: Date;
  updated_at: Date;
}

interface DonationCreationAttributes extends Optional<DonationAttributes, 'id' | 'notes' | 'feedback' | 'source_info' | 'associated_tag'> { }

@Table({ tableName: 'donations' })
class Donation extends Model<DonationAttributes, DonationCreationAttributes>
  implements DonationAttributes {

  @Column({
    type: DataType.NUMBER,
    autoIncrement: true,
    primaryKey: true,
    unique: true
  })
  id!: number;

  @Column({ type: DataType.STRING })
  request_id!: string;

  @Column({ type: DataType.INTEGER })
  user_id!: number;

  @Column({ type: DataType.INTEGER })
  group_id!: number | null;

  @Column({ type: DataType.STRING })
  category!: 'Public' | 'Foundation';

  @Column({ type: DataType.STRING })
  grove!: string;

  @Column({ type: DataType.INTEGER })
  pledged!: number;

  @Column({ type: DataType.FLOAT })
  pledged_area!: number;

  @Column({ type: DataType.STRING })
  preference!: string;

  @Column({ type: DataType.INTEGER })
  payment_id!: number | null;

  @Column({ type: DataType.TEXT })
  feedback!: string | null;

  @Column({ type: DataType.TEXT })
  notes!: string | null;

  @Column({ type: DataType.STRING })
  associated_tag!: string;

  @Column({ type: DataType.STRING })
  event_name!: string | null;

  @Column({ type: DataType.STRING })
  alternate_email!: string | null;

  @Column({ type: DataType.TEXT })
  source_info!: string | null;

  @Column({ type: DataType.STRING })
  logo!: string | null;

  @Column({ type: DataType.INTEGER })
  created_by!: number;

  @Column({ type: DataType.DATE })
  created_at!: Date;

  @Column({ type: DataType.DATE })
  updated_at!: Date;
}

export { Donation }
export type { DonationAttributes, DonationCreationAttributes }