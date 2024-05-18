// import mongoose from "mongoose";
// import { MONGO_CREATE_INDEX_MAX_TIMEOUT } from "../services/mongo";

// const Schema = mongoose.Schema;

// const updateSchema = new Schema({
//   image: { type: String },
//   date_added: { type: Date },
// });

// const treePhotoUpdateSchema = new Schema({
//   tree_id: { type: mongoose.Schema.Types.ObjectId, ref: "trees" },
//   photo_update: [
//     {
//       type: updateSchema,
//       required: true,
//     },
//   ],
// });

// const treeUpdatePhotoModel = mongoose.model(
//   "tree_update_photos",
//   treePhotoUpdateSchema
// );

// treeUpdatePhotoModel.createIndexes({
//   maxTimeMS: MONGO_CREATE_INDEX_MAX_TIMEOUT,
// }); //create index

// module.exports = treeUpdatePhotoModel;




import { Model, Column, Table, DataType, ForeignKey, BelongsTo } from 'sequelize-typescript';
// import { Tree } from './Tree'; // Import the Tree model

@Table({ tableName: 'treeupdate' })
export class TreeUpdate extends Model<TreeUpdate> {
  @Column(DataType.STRING)
  image!: string;

  @Column(DataType.DATE)
  date_added!: Date;




  // @ForeignKey(() => Tree)
  // @Column(DataType.UUID)
  // tree_id!: string;

  // @BelongsTo(() => Tree)
  // tree!: Tree;

  @Column(DataType.ARRAY(DataType.JSONB))
  photo_update!: TreeUpdate[];
}

