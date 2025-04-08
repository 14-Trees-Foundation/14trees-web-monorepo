// import mongoose from "mongoose";
// import { MONGO_CREATE_INDEX_MAX_TIMEOUT } from "../services/mongo";

// const Schema = mongoose.Schema;

// const supporter = new Schema({
//   name: { type: String, required: true },
//   contact: { type: Number, required: true },
//   email: { type: String, required: true },
//   date_added: { type: Date },
// });

// const supporterModel = mongoose.model("supporters", supporter);
// supporterModel.createIndexes({ maxTimeMS: MONGO_CREATE_INDEX_MAX_TIMEOUT }); //create index
// module.exports = supporterModel;



// Model in postgresql db

import { Table, Column, Model, DataType } from 'sequelize-typescript';

@Table({ tableName: 'supporters' })
export class Supporter extends Model {
  @Column({ type: DataType.STRING, allowNull: false })
  name!: string;

  @Column({ type: DataType.INTEGER, allowNull: false })
  contact!: number;

  @Column({ type: DataType.STRING, allowNull: false })
  email!: string;

  @Column({ type: DataType.DATE })
  date_added?: Date;
}