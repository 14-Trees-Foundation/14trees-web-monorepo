// src/models/cylinderPerformance.model.ts
import { Optional } from 'sequelize';
import { Table, Column, Model, DataType } from 'sequelize-typescript';

interface CylinderPerformanceAttributes {
  imo_number: string;
  cylinder_number: number;
  max_pressure_bar: number;
  compression_pressure: number;
  exhaust_temp: number;
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
    type: DataType.STRING(10),
    primaryKey: true,
    allowNull: false
  })
  imo_number!: string;

  @Column({
    type: DataType.INTEGER,
    primaryKey: true,
    allowNull: false
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
    field: 'compression_pressure'
  })
  compression_pressure!: number;

  @Column({
    type: DataType.DECIMAL(10,5),
    allowNull: false,
    field: 'exhaust_temp'
  })
  exhaust_temp!: number;
}

export { CylinderPerformance };
export type { CylinderPerformanceAttributes, CylinderPerformanceCreationAttributes };