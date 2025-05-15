// src/models/operatingConditions.model.ts
import { Optional } from 'sequelize';
import { Table, Column, Model, DataType } from 'sequelize-typescript';

interface OperatingConditionsAttributes {
  imo_number: string;
  parameter: string;
  unit: string;
  value: number;
}

interface OperatingConditionsCreationAttributes extends Optional<OperatingConditionsAttributes, never> {}

@Table({ 
  tableName: 'operating_conditions',
  schema: 'Shipping',
  timestamps: false
})
class OperatingConditions extends Model<OperatingConditionsAttributes, OperatingConditionsCreationAttributes> 
  implements OperatingConditionsAttributes {

  @Column({
    type: DataType.STRING(10),
    primaryKey: true,
    allowNull: false
  })
  imo_number!: string;

  @Column({
    type: DataType.STRING(50),
    primaryKey: true,
    allowNull: false
  })
  parameter!: string;

  @Column({
    type: DataType.STRING(10),
    allowNull: false
  })
  unit!: string;

  @Column({
    type: DataType.DECIMAL(12,4),
    allowNull: false
  })
  value!: number;
}

export { OperatingConditions };
export type { OperatingConditionsAttributes, OperatingConditionsCreationAttributes };