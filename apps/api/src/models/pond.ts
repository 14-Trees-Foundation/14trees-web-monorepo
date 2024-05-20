//Model in postgresql db

import { Optional } from 'sequelize';
import { Table, Column, Model, DataType } from 'sequelize-typescript';
import { Boundaries } from './common';
// import {OnSiteStaff} from './onsitestaff'

interface PondUpdateAttributes{
  date: Date,
  levelFt: Number,
  // user: { type: mongoose.Schema.Types.ObjectId, ref: "onsitestaffs" },
  // user: OnSiteStaff
  images: string[],
}

interface PondAttributes {
	id: string;
	name: string;
	tags: string[];
	type: string;
	boundaries: Boundaries;
  date_added: Date;
  images: string[];
  lengthFt: number;
  widthFt: number;
  depthFt: number;
  updates: PondUpdateAttributes[];
}

interface PondCreationAttributes
	extends Optional<PondAttributes, 'id' | 'tags' | 'boundaries' | 'updates'> {}

@Table({ tableName: 'ponds' })
export class Pond extends Model<PondAttributes, PondCreationAttributes>
implements PondAttributes {

  @Column({
    type: DataType.STRING,
    allowNull: false,
    field: "_id",
    primaryKey: true,
    unique: true
  })
  id!: string;


  @Column(DataType.STRING)
  name!: string;

  @Column({
    type: DataType.ARRAY(DataType.STRING),
    allowNull: true
  })
  tags!: string[];


  @Column(DataType.STRING)
  type!: string;

  @Column({
    type: DataType.JSON,
    allowNull: true
  })
  boundaries!: { type: string, coordinates: number[][][] };

  @Column(DataType.DATE)
  date_added!: Date;

  @Column(DataType.ARRAY(DataType.STRING))
  images!: string[];

  @Column(DataType.FLOAT)
  lengthFt!: number;

  @Column(DataType.FLOAT)
  widthFt!: number;

  @Column(DataType.FLOAT)
  depthFt!: number;

  @Column({
    type: DataType.ARRAY(DataType.JSON),
    allowNull: true,
  })
  updates!: PondUpdateAttributes[];
}

export type {PondCreationAttributes, PondAttributes}