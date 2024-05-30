//Model in postgresql db

import { Optional } from 'sequelize';
import { Table, Column, Model, DataType } from 'sequelize-typescript';

interface TreeTypeAttributes {
	id: number;
	name: string;
	scientific_name: string;
	tree_id: string;
  image: string[];
	tags: string[];
  habit: string;
  name_english: string;
  family?: string;
  remarkable_char?: string;
  med_use?: string;
  other_use?: string;
  food?: string;
  eco_value?: string;
  description?: string;
}

interface TreeTypeCreationAttributes
	extends Optional<TreeTypeAttributes, 'tags' | 'image' | 'family' | 'remarkable_char' | 'med_use' | 'other_use' | 'food' | 'eco_value' | 'description'> {}

@Table({ tableName: 'tree_types' })
class TreeType extends Model<TreeTypeAttributes, TreeTypeCreationAttributes>
implements TreeTypeAttributes {

  @Column({
    type: DataType.NUMBER,
    allowNull: false,
    primaryKey: true,
    unique: true
  })
  id!: number;


  @Column(DataType.STRING)
  name!: string;

  @Column(DataType.STRING)
  scientific_name!: string;

  @Column({
    type: DataType.STRING,
    allowNull: false,
    unique: true
  })
  tree_id!: string;

  @Column(DataType.ARRAY(DataType.STRING))
  image!: string[];

  @Column({
    type: DataType.ARRAY(DataType.STRING),
    allowNull: true
  })
  tags!: string[];

  @Column(DataType.STRING)
  habit!: string;

  @Column(DataType.STRING)
  name_english!: string;

  @Column(DataType.STRING)
  family!: string;

  @Column(DataType.STRING)
  remarkable_char!: string;

  @Column(DataType.STRING)
  med_use!: string;

  @Column(DataType.STRING)
  other_use!: string;

  @Column(DataType.STRING)
  food!: string;

  @Column(DataType.STRING)
  eco_value!: string;

  @Column(DataType.STRING)
  desc!: string;
}

export { TreeType }
export type {TreeTypeAttributes, TreeTypeCreationAttributes}