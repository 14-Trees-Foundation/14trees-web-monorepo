//Model in postgresql db

import { Optional } from 'sequelize';
import { Table, Column, Model, DataType } from 'sequelize-typescript';
import { Boundaries } from './common';

interface PondAttributes {
	id: number;
	name: string;
	tags: string[];
	type: string;
  site_id: number;
	boundaries: Boundaries;
  image: string | null;
  length_ft: number;
  width_ft: number;
  depth_ft: number;
  created_at: Date;
  updated_at: Date;
}

interface PondCreationAttributes
	extends Optional<PondAttributes, 'id' | 'tags' | 'boundaries'> {}

@Table({ tableName: 'ponds' })
export class Pond extends Model<PondAttributes, PondCreationAttributes>
implements PondAttributes {

  @Column({
    type: DataType.NUMBER,
    allowNull: false,
    primaryKey: true,
    autoIncrement: true,
    unique: true
  })
  id!: number;


  @Column(DataType.STRING)
  name!: string;

  @Column({
    type: DataType.ARRAY(DataType.STRING),
    allowNull: true
  })
  tags!: string[];

  @Column(DataType.STRING)
  type!: string;

  
  @Column({ type :DataType.NUMBER , allowNull: true})
  site_id!: number;

  @Column({
    type: DataType.JSON,
    allowNull: true
  })
  boundaries!: Boundaries;

  @Column(DataType.STRING)
  image!: string;

  @Column(DataType.FLOAT)
  length_ft!: number;

  @Column(DataType.FLOAT)
  width_ft!: number;

  @Column(DataType.FLOAT)
  depth_ft!: number;

  @Column(DataType.DATE)
  created_at!: Date;

  @Column(DataType.DATE)
  updated_at!: Date;
}

export type {PondCreationAttributes, PondAttributes}