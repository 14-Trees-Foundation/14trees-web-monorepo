// import mongoose from "mongoose";
// import { MONGO_CREATE_INDEX_MAX_TIMEOUT } from "../services/mongo";

// const Schema = mongoose.Schema;

// const pondUpdate = new Schema({
//   date: { type: Date },
//   levelFt: { type: Number },
//   user: { type: mongoose.Schema.Types.ObjectId, ref: "onsitestaffs" },
//   images: [{ type: String }],
// });

// const pondSchema = new Schema({
//   name: { type: String, required: true },
//   tags: [{ type: String }],
//   desc: { type: String },
//   type: { type: String },
//   boundaries: {
//     type: { type: String, default: "Polygon" },
//     coordinates: { type: [[[Number]]] },
//   },
//   date_added: { type: Date },
//   images: [{ type: String }],
//   lengthFt: { type: Number },
//   widthFt: { type: Number },
//   depthFt: { type: Number },
//   updates: [pondUpdate],
// });

// const PondModel = mongoose.model("ponds", pondSchema);

// PondModel.createIndexes({ maxTimeMS: MONGO_CREATE_INDEX_MAX_TIMEOUT }); //create index

// module.exports = { PondModel, pondUpdate };





//Model in postgresql db

import { Optional } from 'sequelize';
import { Model, DataType } from 'sequelize-typescript';
import { Boundaries } from './common';
import {sequelize} from '../config/postgreDB';
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
	desc: string;
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

class Pond
extends Model<PondAttributes, PondCreationAttributes>
implements PondAttributes {
	public id!: string;
  public name!: string;
	public tags!: string[];
	public desc!: string;
	public type!: string;
	public boundaries!: Boundaries;
  public date_added!: Date;
  public images!: string[];
  public lengthFt!: number;
  public widthFt!: number;
  public depthFt!: number;
  public updates!: PondUpdateAttributes[];
}


Pond.init(
	{
		id: {
			type: DataType.STRING,
      allowNull: false,
      field: "_id",
      primaryKey: true,
      unique: true
		},
		name: {
      type: DataType.STRING
    },
    tags: {
      type: DataType.ARRAY(DataType.STRING)
    },
    desc: {
      type: DataType.STRING
    },
    type: {
      type: DataType.STRING
    },
    boundaries: {
      type: DataType.JSON
    },
    date_added: {
      type: DataType.DATE
    },
    images: {
      type: DataType.ARRAY(DataType.STRING)
    },
    lengthFt: {
      type: DataType.FLOAT
    },
    widthFt: {
      type: DataType.FLOAT
    },
    depthFt: {
      type: DataType.FLOAT
    },
    updates: {
      type: DataType.ARRAY(DataType.JSON)
    },
	},
	{
		sequelize,
		modelName: 'Pond',
		tableName: 'ponds',
		timestamps: false,
	},
);

export { Pond }
export type { PondCreationAttributes, PondAttributes }
