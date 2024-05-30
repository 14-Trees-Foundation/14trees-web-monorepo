//Model in postgresql db

import { Optional } from 'sequelize';
import { Table, Column, Model, DataType } from 'sequelize-typescript';

interface PondWaterLevelAttributes {
	id: number;
	level_ft: number;
	user_id?: number;
  pond_id: number;
  images: string[];
}

interface PondWaterLevelCreationAttributes
	extends Optional<PondWaterLevelAttributes, 'images' | 'id'> {}

@Table({ tableName: 'pond_water_level' })
class PondWaterLevel extends Model<PondWaterLevelAttributes, PondWaterLevelCreationAttributes>
implements PondWaterLevelAttributes {

  @Column({
    type: DataType.NUMBER,
    allowNull: false,
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

  @Column(DataType.ARRAY(DataType.STRING))
  images!: string[];
}

export { PondWaterLevel }
export type { PondWaterLevelAttributes, PondWaterLevelCreationAttributes }