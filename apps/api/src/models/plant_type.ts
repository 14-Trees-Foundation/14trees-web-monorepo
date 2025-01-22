//Model in postgresql db

import { Optional } from 'sequelize';
import { Table, Column, Model, DataType } from 'sequelize-typescript';

interface PlantTypeAttributes {
	id: number;
	name: string;
  english_name: string;
  common_name_in_english?: string;
  common_name_in_marathi?: string;
	scientific_name: string;
	plant_type_id: string;
  images: string[];
	tags?: string[];
  habit: string;
  family?: string;
  category?: string;
  known_as: string;
  use?:string;
  names_index?: string;
  status?: string;
  status_message?: string[];
  last_system_updated_at?: Date;
  illustration_link: string | null;
  illustration_s3_path: string | null;
  combined_name: string;
  created_at?: Date;
  updated_at?: Date;
}

interface PlantTypeCreationAttributes
	extends Optional<PlantTypeAttributes, 'id' | 'tags' | 'images' | 'family' | 'use' | 'status' | 'illustration_link' | 'illustration_s3_path' | 'combined_name'> {}

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
  english_name!: string;

  @Column(DataType.STRING)
  common_name_in_english!: string;

  @Column(DataType.STRING)
  common_name_in_marathi!: string;

  @Column(DataType.STRING)
  scientific_name!: string;

  @Column(DataType.STRING)
  known_as!: string;

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
  use!: string;
  
  @Column(DataType.STRING)
  names_index!: string;
  
  @Column(DataType.STRING)
  illustration_link!: string | null;

  @Column(DataType.STRING)
  illustration_s3_path!: string | null;

  @Column(DataType.STRING)
  status!: string;

  @Column(DataType.STRING)
  combined_name!: string;

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