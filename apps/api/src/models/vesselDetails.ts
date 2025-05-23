// src/models/vesselDetail.model.ts
import { Optional } from 'sequelize';
import { Table, Column, Model, DataType } from 'sequelize-typescript';

interface VesselDetailAttributes {
  vessel_name: string;
  imo_number: string;
  date: Date;
  time: string;
  location: string;
  main_engine_type: string;
  engine_model: string;
  rated_power_kw: number;
}

interface VesselDetailCreationAttributes extends Optional<VesselDetailAttributes, never> {}

@Table({ 
  tableName: 'vessel_detail',
  schema: 'Shipping',
  timestamps: false
})
class VesselDetail extends Model<VesselDetailAttributes, VesselDetailCreationAttributes> 
  implements VesselDetailAttributes {

  @Column({
    type: DataType.STRING(100),
    allowNull: false,
    field: 'vessel_name'
  })
  vessel_name!: string;

  @Column({
    type: DataType.STRING(20),
    primaryKey: true,
    allowNull: false,
    field: 'imo_number'
  })
  imo_number!: string;

  @Column({
    type: DataType.DATEONLY,
    allowNull: false,
    field: 'date'
  })
  date!: Date;

  @Column({
    type: DataType.TIME,
    allowNull: false,
    field: 'time'
  })
  time!: string;

  @Column({
    type: DataType.STRING(100),
    allowNull: false,
    field: 'location'
  })
  location!: string;

  @Column({
    type: DataType.STRING(50),
    allowNull: false,
    field: 'main_engine_type'
  })
  main_engine_type!: string;

  @Column({
    type: DataType.STRING(100),
    allowNull: false,
    field: 'engine_model'
  })
  engine_model!: string;

  @Column({
    type: DataType.INTEGER,
    allowNull: false,
    field: 'rated_power_kw'
  })
  rated_power_kw!: number;
}

export { VesselDetail };
export type { VesselDetailAttributes, VesselDetailCreationAttributes };