// import mongoose from "mongoose";
// import { MONGO_CREATE_INDEX_MAX_TIMEOUT } from "../services/mongo";

// const Schema = mongoose.Schema;

// const eventSchema = new Schema({
//   name: { type: String },
//   assigned_by: { type: mongoose.Schema.Types.ObjectId, ref: "users" },
//   assigned_to: [{ type: mongoose.Schema.Types.ObjectId, ref: "users" }],
//   user_trees: [{ type: mongoose.Schema.Types.ObjectId, ref: "user_tree_reg" }],
//   plot_id: { type: mongoose.Schema.Types.ObjectId, ref: "plots" },
//   link: { type: String },
//   type: { type: String },
//   desc: { type: String },
//   tags: [{ type: String }],
//   date: { type: Date },
// });

// const eventModel = mongoose.model("events", eventSchema);

// eventModel.createIndexes({ maxTimeMS: MONGO_CREATE_INDEX_MAX_TIMEOUT }); //create index

// module.exports = eventModel;





import { Table, Column, Model, ForeignKey, BelongsTo, BelongsToMany, DataType } from 'sequelize-typescript';
import { User } from './user';
import { Plot } from './plot';
import { Optional } from 'sequelize';
import { UserTree } from './userprofile';

type PlantationType = 'onsite' | 'offsite'

interface EventAttributes {
	id: number;
  assigned_by: number;
  site_id: number;
  name: string;
	type: number;
  description?: string;
	tags?: string[];
  event_date: Date;
  memories?: string[];
  plantation_type: PlantationType;
}

interface EventCreationAttributes
	extends Optional<EventAttributes, 'tags' | 'memories' | 'description'> {}

@Table({ tableName: 'events' })
export class Event extends Model<EventAttributes, EventCreationAttributes>
implements EventAttributes {

  @Column({
    type: DataType.NUMBER,
    allowNull: false,
    primaryKey: true,
    unique: true
  })
  id!: number;

  @ForeignKey(() => User)
  @Column(DataType.NUMBER)
  assigned_by!: number;

  @Column(DataType.NUMBER)
  site_id!: number;

  @Column(DataType.NUMBER)
  type!: number;

  @Column(DataType.STRING)
  name!: string;

  @Column(DataType.STRING)
  description?: string;

  @Column(DataType.STRING)
  plantation_type!: PlantationType;

  @Column(DataType.ARRAY(DataType.STRING))
  tags?: string[];

  @Column(DataType.ARRAY(DataType.STRING))
  memories?: string[];

  @Column(DataType.DATE)
  event_date!: Date;
}
