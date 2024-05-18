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

import { Table, Column, Model, DataType, ForeignKey, BelongsTo } from 'sequelize-typescript';


@Table({ 
  tableName: 'ponds' 
}) // Set the table name

export class Pond extends Model<Pond> {
  @Column(DataType.STRING)
  name!: string;

  @Column(DataType.ARRAY(DataType.STRING))
  tags!: string[];

  @Column(DataType.STRING)
  desc!: string;

  @Column(DataType.STRING)
  type!: string;

  @Column(DataType.JSON)
  boundaries!: { type: string, coordinates: number[][][] };

  @Column(DataType.DATE)
  dateAdded!: Date;

  @Column(DataType.ARRAY(DataType.STRING))
  images!: string[];

  @Column(DataType.FLOAT)
  lengthFt!: number;

  @Column(DataType.FLOAT)
  widthFt!: number;

  @Column(DataType.FLOAT)
  depthFt!: number;

  // @Column(DataType.ARRAY(DataType.JSON))
  // updates!: PondUpdate[];
}
