// src/models/fuelLubricant.model.ts
import { Optional } from 'sequelize';
import { Table, Column, Model, DataType } from 'sequelize-typescript';

interface FuelLubricantAttributes {
  imo_number: string;
  fuel_type_used: string;
  sulfur_content: number;
  lubricant_type: string;
  bn_number: number;
}

interface FuelLubricantCreationAttributes extends Optional<FuelLubricantAttributes, never> {}

@Table({ 
  tableName: 'fuel_lubricant',
  schema: 'Shipping',
  timestamps: false
})
class FuelLubricant extends Model<FuelLubricantAttributes, FuelLubricantCreationAttributes> 
  implements FuelLubricantAttributes {

  @Column({
    type: DataType.STRING(10),
    primaryKey: true,
    allowNull: false
  })
  imo_number!: string;

  @Column({
    type: DataType.STRING(10),
    allowNull: false,
    field: 'fuel_type_used'
  })
  fuel_type_used!: string;

  @Column({
    type: DataType.DECIMAL(5,2),
    allowNull: false,
    field: 'sulfur_content'
  })
  sulfur_content!: number;

  @Column({
    type: DataType.STRING(20),
    allowNull: false,
    field: 'lubricant_type'
  })
  lubricant_type!: string;

  @Column({
    type: DataType.INTEGER,
    allowNull: false,
    field: 'bn_number'
  })
  bn_number!: number;
}

export { FuelLubricant };
export type { FuelLubricantAttributes, FuelLubricantCreationAttributes };