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

interface EventAttributes {
	id: string;
  assigned_by: string;
  assigned_to: string[];
  user_trees: string[];
  plot_id: string;
  link: string;
  desc: string;
	tags: string[];
	type: number;
  date: Date;
}

interface EventCreationAttributes
	extends Optional<EventAttributes, 'tags' | 'assigned_to' | 'desc'> {}

@Table({ tableName: 'events' })
export class Event extends Model<EventAttributes, EventCreationAttributes>
implements EventAttributes {

  @Column({
    type: DataType.STRING,
    allowNull: false,
    field: "_id",
    primaryKey: true,
    unique: true
  })
  id!: string;

  @ForeignKey(() => User)
  @Column
  assigned_by!: string;
  
  @BelongsTo(() => User, 'assigned_by')
  assignedBy!: User;

  @Column
  assigned_to!: string[];

  @BelongsToMany(() => User, 'assigned_to', 'event_id', 'user_id')
  assignedTo!: User[];

  @Column
  user_trees!: string[];

  @BelongsToMany(() => UserTree, 'user_trees', 'event_id', 'user_tree_id')
  userTrees!: UserTree[];

  @ForeignKey(() => Plot)
  @Column
  plot_id!: string;

  @BelongsTo(() => Plot, 'plot_id')
  plot!: Plot;

  @Column
  link!: string;

  @Column
  type!: number;

  @Column
  desc!: string;

  @Column
  tags!: string[];

  @Column
  date!: Date;
}
