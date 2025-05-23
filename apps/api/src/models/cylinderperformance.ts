// src/models/cylinderPerformance.model.ts
import { Optional } from 'sequelize';
import { Table, Column, Model, DataType } from 'sequelize-typescript';

interface CylinderPerformanceAttributes {
  cylinder_number: number;
  max_pressure_bar: number;
  exhaust_temp: number;
  voyage_no: number;
  compression_pressure_bar: number;
}

interface CylinderPerformanceCreationAttributes extends Optional<CylinderPerformanceAttributes, never> {}

@Table({ 
  tableName: 'cylinder_performance',
  schema: 'Shipping',
  timestamps: false
})
class CylinderPerformance extends Model<CylinderPerformanceAttributes, CylinderPerformanceCreationAttributes> 
  implements CylinderPerformanceAttributes {

  @Column({
    type: DataType.INTEGER,
    primaryKey: true,
    allowNull: false,
    field: 'cylinder_number'
  })
  cylinder_number!: number;

  @Column({
    type: DataType.DECIMAL(10,5),
    allowNull: false,
    field: 'max_pressure_bar'
  })
  max_pressure_bar!: number;

  @Column({
    type: DataType.DECIMAL(10,5),
    allowNull: false,
    field: 'exhaust_temp'
  })
  exhaust_temp!: number;

  @Column({
    type: DataType.INTEGER,
    allowNull: false,
    field: 'voyage_no'
  })
  voyage_no!: number;

  @Column({
    type: DataType.FLOAT,
    allowNull: false,
    field: 'compression_pressure_bar'
  })
  compression_pressure_bar!: number;
}

export { CylinderPerformance };
export type { CylinderPerformanceAttributes, CylinderPerformanceCreationAttributes };