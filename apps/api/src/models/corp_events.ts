// import mongoose from "mongoose";
// import { MONGO_CREATE_INDEX_MAX_TIMEOUT } from "../services/mongo";

// const Schema = mongoose.Schema;

// const corpEventSchema = new Schema({
//   event_link: { type: String },
//   event_name: { type: String },
//   tree_ids: [{ type: mongoose.Schema.Types.ObjectId, ref: "trees" }],
//   plot_id: { type: mongoose.Schema.Types.ObjectId, ref: "plots" },
//   title: { type: String },
//   logo: [{ type: String }],
//   short_desc: { type: String },
//   long_desc: { type: String },
//   num_people: { type: String },
//   header_img: { type: String },
//   plot_desc: { type: String },
//   album: [{ type: String }],
//   plot_img: { type: String },
//   date_added: { type: Date },
// });

// const corpEventModel = mongoose.model("corp_events", corpEventSchema);

// corpEventModel.createIndexes({ maxTimeMS: MONGO_CREATE_INDEX_MAX_TIMEOUT }); //create index

// module.exports = corpEventModel;




// Model in postgreSQL db

import { Model, Table, Column, DataType, ForeignKey } from 'sequelize-typescript';
// import { Tree } from './Tree';   //they can be used for foreign key purposes
// import { Plot } from './Plot';

@Table({
  tableName: 'corp_events',
  // timestamps: false, // Adjust based on your requirements
})
export class CorpEvent extends Model<CorpEvent> {
  @Column({
    type: DataType.STRING,
  })
  event_link!: string;

  @Column({
    type: DataType.STRING,
  })
  event_name!: string;

  // @Column({
  //   type: DataType.ARRAY(DataType.INTEGER), // assuming IDs are integers, change if needed
  // })
  // // @ForeignKey(() => Tree)
  // // tree_ids!: number[];

  // // @ForeignKey(() => Plot)
  @Column({
    type: DataType.INTEGER,
  })
  plot_id!: number;

  @Column({
    type: DataType.STRING,
  })
  title!: string;

  @Column({
    type: DataType.ARRAY(DataType.STRING),
  })
  logo!: string[];

  @Column({
    type: DataType.STRING,
  })
  short_desc!: string;

  @Column({
    type: DataType.STRING,
  })
  long_desc!: string;

  @Column({
    type: DataType.STRING,
  })
  num_people!: string;

  // @Column({
  //   type: DataType.STRING,
  // })
  // header_img!: string;

  @Column({
    type: DataType.STRING,
  })
  plot_desc!: string;

  @Column({
    type: DataType.ARRAY(DataType.STRING),
  })
  album!: string[];

  @Column({
    type: DataType.STRING,
  })
  plot_img!: string;

  @Column({
    type: DataType.DATE,
  })
  date_added!: Date;
}
