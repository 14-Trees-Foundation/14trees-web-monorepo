import { Optional } from 'sequelize';
import { Table, Column, Model, DataType } from 'sequelize-typescript';

interface LogsInfoAttributes {
	id: number;
	phone_info: string | null;
	device_info: string | null;
	user_id: number;
    logs: string;
    timestamp: Date;
}

interface LogsInfoCreationAttributes
	extends Optional<LogsInfoAttributes, 'id'> {}

@Table({ tableName: 'logs_info' })
class LogsInfo extends Model<LogsInfoAttributes, LogsInfoCreationAttributes>
implements LogsInfoAttributes {

  @Column({
    type: DataType.INTEGER,
    autoIncrement: true,
    primaryKey: true,
    unique: true
  })
  id!: number;

  @Column({ type: DataType.STRING })
  phone_info!: string;

  @Column({ type: DataType.STRING })
  device_info!: string;

  @Column({ type: DataType.INTEGER, allowNull: false })
  user_id!: number;

  @Column({ type: DataType.JSONB, allowNull: false })
  logs!: string;

  @Column(DataType.DATE)
  timestamp!: Date;
}

export { LogsInfo }
export type { LogsInfoAttributes, LogsInfoCreationAttributes }
