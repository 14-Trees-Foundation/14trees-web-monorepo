// import mongoose from "mongoose";
// import { MONGO_CREATE_INDEX_MAX_TIMEOUT } from "../services/mongo";

// const Schema = mongoose.Schema;

// const albuumsSchema = new Schema({
//   user_id: { type: mongoose.Schema.Types.ObjectId, ref: "users" },
//   album_name: { type: String },
//   images: [{ type: String }],
//   date_added: { type: Date },
//   status: { type: String, default: "active" },
// });

// const abumsModel = mongoose.model("albums", albuumsSchema);

// abumsModel.createIndexes({maxTimeMS: MONGO_CREATE_INDEX_MAX_TIMEOUT}); //create index

// module.exports = abumsModel;


// Model in postgreSQL db written inn typescript

import { Model, Table, Column, DataType } from 'sequelize-typescript';


@Table({
  tableName: 'albums'
})
export class Album extends Model {
 
  @Column({          //this will take reference from user collection and its type will also be from user collection
    type: DataType.INTEGER,
    allowNull: false,
  })
  userId!: string;

  @Column({
    type: DataType.STRING,
    
  })
  albumname!: string;

  @Column({
    type: DataType.ARRAY(DataType.STRING),
  })
  images!: string[];


  @Column({
    type: DataType.DATE,
  
  })
  date!: Date;

  @Column({
    type: DataType.STRING,
    allowNull: false,
  })
  status!: string;

}
export default Album;
