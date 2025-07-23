// import mongoose from "mongoose";
// import { MONGO_CREATE_INDEX_MAX_TIMEOUT } from "../services/mongo";

// const Schema = mongoose.Schema;

// const activitySchema = new Schema({
//     title: {type: String, required: true},
//     type: {type: String, required: true},
//     date: {type: Date, required: true},
//     desc: {type: String, required: true},
//     author: {type: String},
//     images: [{type: String}],
//     video: {type: String}
// });

// const activityModel = mongoose.model("activities", activitySchema);

// activityModel.createIndexes({maxTimeMS: MONGO_CREATE_INDEX_MAX_TIMEOUT}); //create index

// module.exports = activityModel;


//  Model in POSTGRESSQL DATABASE in typescript 
import { Model, Table, Column, DataType } from 'sequelize-typescript';

@Table({
  tableName: 'activities'
})
export class Activity extends Model {
  @Column({
    type: DataType.STRING,
    allowNull: false,
  })
  title!: string;

  @Column({
    type: DataType.STRING,
    allowNull: false,
  })
  type!: string;

  @Column({
    type: DataType.DATE,
    allowNull: false,
  })
  date!: Date;

  @Column({
    type: DataType.STRING,
    allowNull: false,
  })
  desc!: string;

  @Column({
    type: DataType.STRING,
  })
  author!: string;

  @Column({
    type: DataType.ARRAY(DataType.STRING),
  })
  images!: string[];

  @Column({
    type: DataType.STRING,
  })
  video!: string;
}

export default Activity;
