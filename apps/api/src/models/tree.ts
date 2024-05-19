// import mongoose from "mongoose";
// import { MONGO_CREATE_INDEX_MAX_TIMEOUT } from "../services/mongo";

// const Schema = mongoose.Schema;

// const treeSchema = new Schema({
//   sapling_id: { type: String, required: true, index: true, unique: true },
//   tree_id: { type: mongoose.Schema.Types.ObjectId, ref: "tree_type" },
//   plot_id: { type: mongoose.Schema.Types.ObjectId, ref: "plots" },
//   user_id: { type: mongoose.Schema.Types.ObjectId, ref: "onsitestaffs" },
//   image: [{ type: String }],
//   height: { type: Number },
//   date_added: { type: Date },
//   tags: [{ type: String }],
//   location: {
//     type: { type: String, default: "Point" },
//     coordinates: { type: [Number], default: [0, 0] },
//   },
//   mapped_to: { type: mongoose.Schema.Types.ObjectId, ref: "users" },
//   link: { type: String },
//   event_type: { type: String },
//   desc: { type: String },
//   date_assigned: { type: Date },
// });

// const treeModel = mongoose.model("trees", treeSchema);

// treeModel.createIndexes({ maxTimeMS: MONGO_CREATE_INDEX_MAX_TIMEOUT }); //create index

// module.exports = treeModel;








// Model in postgresql db


import { Table, Column, Model, DataType, ForeignKey, BelongsTo } from 'sequelize-typescript';
import { TreeType } from '../models/treetype_model'
import { Plot } from '../models/plot'
import OnSiteStaff from "../models/onsitestaff";
import { User } from './user'

@Table({
  tableName: 'trees'
})
export class Tree extends Model {
  @Column({ type: DataType.STRING, allowNull: false, unique: true })
  sapling_id!: string;

  @ForeignKey(() => TreeType)
  @Column
  tree_id!: number;

  @ForeignKey(() => Plot)
  @Column
  plot_id!: number;

  @ForeignKey(() => OnSiteStaff)
  @Column
  user_id!: number;

  @Column(DataType.ARRAY(DataType.STRING))
  image!: string[];

  @Column(DataType.FLOAT)
  height!: number;

  @Column(DataType.DATE)
  date_added!: Date;

  @Column(DataType.ARRAY(DataType.STRING))
  tags!: string[];

  @Column(DataType.JSON)
  location!: { type: string, coordinates: number[] };

  @ForeignKey(() => User)
  @Column
  mapped_to!: number;

  @Column(DataType.STRING)
  link!: string;

  @Column(DataType.STRING)
  event_type!: string;

  @Column(DataType.STRING)
  desc!: string;

  @Column(DataType.DATE)
  date_assigned!: Date;

  @BelongsTo(() => TreeType)
  treeType!: TreeType;

  @BelongsTo(() => Plot)
  plot!: Plot;

  @BelongsTo(() => OnSiteStaff)
  onSiteStaff!: OnSiteStaff;

  @BelongsTo(() => User)
  user!: User;
}
