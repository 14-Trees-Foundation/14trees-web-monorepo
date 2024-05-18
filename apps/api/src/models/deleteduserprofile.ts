// import mongoose from "mongoose";

// const Schema = mongoose.Schema;

// const userTree = new Schema({
//   tree: { type: mongoose.Schema.Types.ObjectId, ref: "trees" },
//   user: { type: mongoose.Schema.Types.ObjectId, ref: "users" },
//   orgid: { type: mongoose.Schema.Types.ObjectId, ref: "organizations" },
//   donated_by: { type: mongoose.Schema.Types.ObjectId, ref: "users" },
//   profile_image: [{ type: String }],
//   gifted_by: { type: String },
//   planted_by: { type: String },
//   memories: [{ type: String }],
//   plantation_type: { type: String },
//   date_added: { type: Date },
//   date_deleted: { type: Date },
// });

// const deletedUserTreeModel = mongoose.model("deleted_user_tree_reg", userTree);
// module.exports = deletedUserTreeModel;



//Model in postgresql db


import { Table, Column, Model, ForeignKey, BelongsTo, DataType } from 'sequelize-typescript';
// import { Tree } from './Tree';
// import { User } from './User';
// import { Organization } from './Organization';

@Table({
  tableName: 'deleted_user_tree_reg',
  timestamps: false,
})
export class UserTree extends Model<UserTree> {
  // @ForeignKey(() => Tree)
  // @Column(DataType.INTEGER)
  // treeId!: number;

  // @ForeignKey(() => User)
  // @Column(DataType.INTEGER)
  // userId!: number;

  // @ForeignKey(() => Organization)
  // @Column(DataType.INTEGER)
  // orgId!: number;

  // @ForeignKey(() => User)
  // @Column(DataType.INTEGER)
  // donatedById!: number;

  @Column(DataType.ARRAY(DataType.STRING))
  profileImage!: string[];

  @Column(DataType.STRING)
  giftedBy!: string;

  @Column(DataType.STRING)
  plantedBy!: string;

  @Column(DataType.ARRAY(DataType.STRING))
  memories!: string[];

  @Column(DataType.STRING)
  plantationType!: string;

  @Column(DataType.DATE)
  dateAdded!: Date;

  @Column(DataType.DATE)
  dateDeleted!: Date;

//   @BelongsTo(() => Tree)
//   tree!: Tree;

//   @BelongsTo(() => User)
//   user!: User;

//   @BelongsTo(() => Organization)
//   organization!: Organization;

//   @BelongsTo(() => User, { foreignKey: 'donatedById' })
//   donatedBy!: User;
// }
}