import { Optional } from 'sequelize';
import { Table, Column, Model, DataType } from 'sequelize-typescript';

interface ShiftAttributes {
	id: number;
	start_time: string;
	end_time: string;
	user_id: number;
    saplings: {
        sequence_no: string,
        sapling_id: string
    }[];
    shift_type: string;
    plot_selected: string;
    time_taken: string;
    trees_planted: number;
    timestamp: Date;
}

interface ShiftCreationAttributes
	extends Optional<ShiftAttributes, 'id'> {}

@Table({ tableName: 'shifts' })
class Shift extends Model<ShiftAttributes, ShiftCreationAttributes>
implements ShiftAttributes {

  @Column({
    type: DataType.INTEGER,
    autoIncrement: true,
    primaryKey: true,
    unique: true
  })
  id!: number;

  @Column({ type: DataType.STRING })
  start_time!: string;

  @Column({ type: DataType.STRING })
  end_time!: string;

  @Column({ type: DataType.STRING })
  shift_type!: string;

  @Column({ type: DataType.STRING })
  plot_selected!: string;

  @Column({ type: DataType.STRING })
  time_taken!: string;

  @Column({ type: DataType.INTEGER })
  trees_planted!: number;

  @Column({ type: DataType.JSON })
  saplings!: any;

  @Column({ type: DataType.INTEGER, allowNull: false })
  user_id!: number;

  @Column(DataType.DATE)
  timestamp!: Date;
}

export { Shift }
export type { ShiftAttributes, ShiftCreationAttributes }
