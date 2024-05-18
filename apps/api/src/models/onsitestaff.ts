// import mongoose from "mongoose";
// // import { MONGO_CREATE_INDEX_MAX_TIMEOUT } from "../services/mongo";

// const Schema = mongoose.Schema;

// let onsitestaff = new Schema({
//   name: { type: String, required: true },
//   user_id: { type: String },
//   phone: { type: Number },
//   image: { type: String },
//   email: { type: String, unique: true },
//   role: { type: String },
//   permissions: [{ type: String }],
//   dob: { type: Date },
//   date_added: { type: Date },
// });

// const onSiteStaff = mongoose.model("onsitestaffs", onsitestaff);
// // onSiteStaff.createIndexes({maxTimeMS: MONGO_CREATE_INDEX_MAX_TIMEOUT}); //create index
// module.exports = onSiteStaff;



//MOdel in postgresql db

import {
  Model,
  Table,
  Column,
  DataType,
  PrimaryKey,
  AutoIncrement,
  Unique,
  AllowNull,
} from 'sequelize-typescript';

@Table({
  tableName: 'onsitestaffs',
  timestamps: false,
})
export class OnSiteStaff extends Model<OnSiteStaff> {
  @PrimaryKey
  @AutoIncrement
  @Column(DataType.INTEGER)
  id!: number;

  @AllowNull(false)
  @Column(DataType.STRING)
  name!: string;

  @Column(DataType.STRING)
  user_id!: string;

  @Column(DataType.BIGINT)
  phone!: number;

  @Column(DataType.STRING)
  image!: string;

  @Unique
  @Column(DataType.STRING)
  email!: string;

  @Column(DataType.STRING)
  role!: string;

  @Column(DataType.ARRAY(DataType.STRING))
  permissions!: string[];

  @Column(DataType.DATE)
  dob!: Date;

  @Column(DataType.DATE)
  date_added!: Date;
}

export default OnSiteStaff;

