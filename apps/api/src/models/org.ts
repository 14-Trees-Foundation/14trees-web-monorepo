// import mongoose from "mongoose";
// import { MONGO_CREATE_INDEX_MAX_TIMEOUT } from "../services/mongo";

// const Schema = mongoose.Schema;

// var orgSchema = new Schema({
//   name: { type: String, required: true, unique: true },
//   type: { type: String },
//   desc: { type: String },
//   date_added: { type: Date },
// });

// const orgModel = mongoose.model("organizations", orgSchema);

// orgModel.createIndexes({ maxTimeMS: MONGO_CREATE_INDEX_MAX_TIMEOUT }); //create index

// module.exports = orgModel;




import { Table, Column, Model, DataType } from 'sequelize-typescript';

@Table
export class Organization extends Model<Organization> {
  @Column({ type: DataType.STRING, allowNull: false, unique: true })
  name!: string;

  @Column({ type: DataType.STRING })
  type?: string;

  @Column({ type: DataType.STRING })
  desc?: string;

  @Column({ type: DataType.DATE })
  date_added?: Date;
}
