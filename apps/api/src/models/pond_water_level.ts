//Model in postgresql db

import { Optional } from 'sequelize';
import { Table, Column, Model, DataType } from 'sequelize-typescript';

interface PondWaterLevelAttributes {
	id: number;
	level_ft: number;
	user_id?: number;
  pond_id: number;
  image: string | null;
  updated_at: Date;
}

interface PondWaterLevelCreationAttributes
	extends Optional<PondWaterLevelAttributes, 'image' | 'id'> {}

@Table({ tableName: 'pond_water_level' })
class PondWaterLevel extends Model<PondWaterLevelAttributes, PondWaterLevelCreationAttributes>
implements PondWaterLevelAttributes {

  @Column({
    type: DataType.NUMBER,
    allowNull: false,
    autoIncrement: true,
    primaryKey: true,
    unique: true
  })
  id!: number;

  @Column({ type: DataType.NUMBER, allowNull: false })
  level_ft!: number;

  @Column({ type: DataType.NUMBER, allowNull: false, unique: true })
  user_id?: number;

  @Column(DataType.NUMBER)
  pond_id!: number;

  @Column(DataType.STRING)
  image!: string;

  @Column({ type: DataType.DATE })
  updated_at!: Date;
}

export { PondWaterLevel }
export type { PondWaterLevelAttributes, PondWaterLevelCreationAttributes }