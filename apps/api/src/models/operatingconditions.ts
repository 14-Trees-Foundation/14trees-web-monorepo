// src/models/operatingConditions.model.ts
import { Optional } from 'sequelize';
import { Table, Column, Model, DataType } from 'sequelize-typescript';

interface OperatingConditionsAttributes {
  imo_number: string;
  engine_load: number;
  engine_rpm: number;
  shaft_power: number;
  fuel_oil_consumption: number;
  cylinder_lubricant_rate: number;
  scavenge_air_pressure: number;
  turbocharger_rpm: number;
}

interface OperatingConditionsCreationAttributes 
  extends Optional<OperatingConditionsAttributes, never> {}

@Table({ 
  tableName: 'operating_conditions',
  schema: 'Shipping',
  timestamps: false
})
class OperatingConditions extends Model<
  OperatingConditionsAttributes, 
  OperatingConditionsCreationAttributes
> implements OperatingConditionsAttributes {

  @Column({
    type: DataType.STRING(10),
    primaryKey: true,
    allowNull: false,
    field: 'imo_number'
  })
  imo_number!: string;

  @Column({
    type: DataType.DECIMAL(5,2),
    allowNull: false,
    field: 'engine_load',
    comment: 'Percentage value'
  })
  engine_load!: number;

  @Column({
    type: DataType.INTEGER,
    allowNull: false,
    field: 'engine_rpm',
    comment: 'Revolutions per minute'
  })
  engine_rpm!: number;

  @Column({
    type: DataType.INTEGER,
    allowNull: false,
    field: 'shaft_power',
    comment: 'Power in kilowatts'
  })
  shaft_power!: number;

  @Column({
    type: DataType.INTEGER,
    allowNull: false,
    field: 'fuel_oil_consumption',
    comment: 'Consumption in kg/hour'
  })
  fuel_oil_consumption!: number;

  @Column({
    type: DataType.DECIMAL(3,1),
    allowNull: false,
    field: 'cylinder_lubricant_rate',
    comment: 'Rate in grams per kWh'
  })
  cylinder_lubricant_rate!: number;

  @Column({
    type: DataType.DECIMAL(3,1),
    allowNull: false,
    field: 'scavenge_air_pressure',
    comment: 'Pressure in bar'
  })
  scavenge_air_pressure!: number;

  @Column({
    type: DataType.INTEGER,
    allowNull: false,
    field: 'turbocharger_rpm',
    comment: 'Revolutions per minute'
  })
  turbocharger_rpm!: number;
}

export { OperatingConditions };
export type { OperatingConditionsAttributes, OperatingConditionsCreationAttributes };