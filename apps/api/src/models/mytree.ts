// import mongoose from "mongoose";
// import { MONGO_CREATE_INDEX_MAX_TIMEOUT } from "../services/mongo";

// const Schema = mongoose.Schema;

// const mytreesSchema = new Schema({
//   user_id: { type: mongoose.Schema.Types.ObjectId, ref: "users" },
//   tree_id: { type: mongoose.Schema.Types.ObjectId, ref: "trees" },
//   assigned: { type: Boolean },
//   assigned_to: { type: mongoose.Schema.Types.ObjectId, ref: "users" },
//   link: { type: String },
//   type: { type: String },
//   date_added: { type: Date },
//   assigned_at: { type: Date },
// });

// const mytreesModel = mongoose.model("mytrees", mytreesSchema);

// mytreesModel.createIndexes({ maxTimeMS: MONGO_CREATE_INDEX_MAX_TIMEOUT }); //create index

// module.exports = mytreesModel;





//Model in postgreSQL db

import { Model, Table, Column, DataType, ForeignKey } from 'sequelize-typescript';
import { User } from './user';  // assuming you have a User model
import { Tree } from './tree';  // assuming you have a Tree model

@Table({
  tableName: 'mytrees',
  timestamps: false,
})
export class MyTree extends Model<MyTree> {
  @ForeignKey(() => User)
  @Column({
    type: DataType.INTEGER,
    allowNull: false,
  })
  user_id!: number;

  @ForeignKey(() => Tree)
  @Column({
    type: DataType.INTEGER,
    allowNull: false,
  })
  tree_id!: number;

  @Column({
    type: DataType.BOOLEAN,
  })
  assigned!: boolean;

  @ForeignKey(() => User)
  @Column({
    type: DataType.INTEGER,
  })
  assigned_to!: number;

  @Column({
    type: DataType.STRING,
  })
  link!: string;

  @Column({
    type: DataType.STRING,
  })
  type!: string;

  @Column({
    type: DataType.DATE,
  })
  date_added!: Date;

  @Column({
    type: DataType.DATE,
  })
  assigned_at!: Date;
}
