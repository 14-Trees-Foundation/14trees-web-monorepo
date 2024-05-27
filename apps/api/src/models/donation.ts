//Model in postgresql db
import { Table, Column, Model, DataType, Unique, Index } from 'sequelize-typescript';
import { Optional } from 'sequelize';

interface DonationAttributes {
  id: string;
  name: string;
  plot_id: string;
  tags?: string[];
  date_added?: Date;
}

interface DonationCreationAttributes
	extends Optional<DonationAttributes, 'id' | 'tags'> {}

@Table({ tableName: 'plots' })
class Donation
extends Model<DonationAttributes, DonationCreationAttributes>
implements DonationAttributes {
    @Column({
      type: DataType.STRING,
      allowNull: false,
      field: "_id",
      primaryKey: true,
      unique: true
    })
    id!: string;

    @Column({ type: DataType.STRING, allowNull: false })
    name!: string;

    @Unique
    @Index
    @Column({ type: DataType.STRING, allowNull: false })
    plot_id!: string;

    @Column({ type: DataType.ARRAY(DataType.STRING) })
    tags?: string[];

    @Column({ type: DataType.DATE })
    date_added?: Date;
}

export { Donation }
export type { DonationAttributes, DonationCreationAttributes }