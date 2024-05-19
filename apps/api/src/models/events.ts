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





import { Table, Column, Model, ForeignKey, BelongsTo, BelongsToMany } from 'sequelize-typescript';
import { User } from './user';
import { Plot } from './plot';
// import { UserTreeReg } from './UserTreeReg';



//this table creates aggregations with other tables that is why all coloumns are comment
@Table({ tableName: 'events' })
export class Event extends Model<Event> {
  @Column
  name!: string;

  @ForeignKey(() => User)
  @Column
  assigned_by!: number;

  @BelongsTo(() => User, 'assigned_by')
  assignedBy!: User;

  @BelongsToMany(() => User, 'event_users', 'event_id', 'user_id')
  assignedTo!: User[];

  // @BelongsToMany(() => UserTreeReg, 'event_user_trees', 'event_id', 'user_tree_id')
  // userTrees!: UserTreeReg[];

  @ForeignKey(() => Plot)
  @Column
  plot_id!: number;

  @BelongsTo(() => Plot, 'plot_id')
  plot!: Plot;

  @Column
  link!: string;

  @Column
  type!: string;

  @Column
  desc!: string;

  @Column
  tags!: string[];

  @Column
  date!: Date;
}
