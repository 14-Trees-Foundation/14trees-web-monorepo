//Model in postgresql db

import { Optional } from 'sequelize';
import { Table, Column, Model, DataType } from 'sequelize-typescript';

interface PlantTypeAttributes {
	id: number;
	name: string;
  name_english: string;
  common_name_english?: string;
  common_name_marathi?: string;
	scientific_name: string;
	plant_type_id: string;
  images: string[];
	tags: string[];
  habit: string;
  family?: string;
  category?: string;
  med_use?: string;
  other_use?: string;
  food?: string;
  eco_value?: string;
  description?: string;
  names_index?: string;
  status?: string;
  status_message?: string[];
  last_system_updated_at?: Date;
  created_at?: Date;
  updated_at?: Date;
}

interface PlantTypeCreationAttributes
	extends Optional<PlantTypeAttributes, 'id' | 'tags' | 'images' | 'family' | 'med_use' | 'other_use' | 'food' | 'eco_value' | 'description' | 'status'> {}

@Table({ tableName: 'plant_types' })
class PlantType extends Model<PlantTypeAttributes, PlantTypeCreationAttributes>
implements PlantTypeAttributes {

  @Column({
    type: DataType.NUMBER,
    allowNull: false,
    autoIncrement: true,
    primaryKey: true,
    unique: true
  })
  id!: number;


  @Column(DataType.STRING)
  name!: string;

  @Column(DataType.STRING)
  name_english!: string;

  @Column(DataType.STRING)
  common_name_english!: string;

  @Column(DataType.STRING)
  common_name_marathi!: string;

  @Column(DataType.STRING)
  scientific_name!: string;

  @Column({
    type: DataType.STRING,
    allowNull: false,
    unique: true
  })
  plant_type_id!: string;

  @Column(DataType.ARRAY(DataType.STRING))
  images!: string[];

  @Column({
    type: DataType.ARRAY(DataType.STRING),
    allowNull: true
  })
  tags!: string[];

  @Column(DataType.STRING)
  habit!: string;

  @Column(DataType.STRING)
  family!: string;

  @Column(DataType.STRING)
  category!: string;

  @Column(DataType.STRING)
  med_use!: string;

  @Column(DataType.STRING)
  other_use!: string;

  @Column(DataType.STRING)
  food!: string;

  @Column(DataType.STRING)
  eco_value!: string;

  @Column(DataType.STRING)
  description!: string;

  @Column(DataType.STRING)
  names_index!: string;
  
  @Column(DataType.STRING)
  status!: string;

  @Column(DataType.ARRAY(DataType.STRING))
  status_message!: string[];

  @Column(DataType.DATE)
  last_system_updated_at!: Date;

  @Column(DataType.DATE)
  created_at!: Date;

  @Column(DataType.DATE)
  updated_at!: Date;
}

export { PlantType }
export type {PlantTypeAttributes, PlantTypeCreationAttributes}