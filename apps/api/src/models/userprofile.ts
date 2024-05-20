// // import mongoose from "mongoose";

// // const Schema = mongoose.Schema;

// // const userTree = new Schema({
// //   tree: { type: mongoose.Schema.Types.ObjectId, ref: "trees" },
// //   user: { type: mongoose.Schema.Types.ObjectId, ref: "users" },
// //   orgid: { type: mongoose.Schema.Types.ObjectId, ref: "organizations" },
// //   donated_by: { type: mongoose.Schema.Types.ObjectId, ref: "users" },
// //   profile_image: [{ type: String }],
// //   gifted_by: { type: String },
// //   planted_by: { type: String },
// //   memories: [{ type: String }],
// //   plantation_type: { type: String },
// //   date_added: { type: Date },
// // });

// // const userTreeModel = mongoose.model("user_tree_reg", userTree);
// // module.exports = userTreeModel;




// //Model in postgresDB
// import { Table, Column, Model, DataType, ForeignKey, BelongsTo } from 'sequelize-typescript';
// import { User } from '../models/user';
// import { Tree } from '../models/tree';
// import { Organization } from '../models/org';

// @Table({
//   tableName: 'userProfile'
// })
// export class UserProfile extends Model {
//   @ForeignKey(() => Tree)
//   @Column
//   tree_id!: number;

//   @BelongsTo(() => Tree)
//   tree!: Tree;

//   @ForeignKey(() => User)
//   @Column
//   user_id!: number;

//   @BelongsTo(() => User)
//   user!: User;

//   @ForeignKey(() => Organization)
//   @Column
//   org_id!: number;

//   @BelongsTo(() => Organization)
//   organization!: Organization;

//   @ForeignKey(() => User)
//   @Column
//   donated_by_id!: number;

//   @BelongsTo(() => User, 'donated_by_id')
//   donatedBy!: User;

//   @Column(DataType.ARRAY(DataType.STRING))
//   profile_image!: string[];

//   @Column(DataType.STRING)
//   gifted_by!: string;

//   @Column(DataType.STRING)
//   planted_by!: string;

//   @Column(DataType.ARRAY(DataType.STRING))
//   memories!: string[];

//   @Column(DataType.STRING)
//   plantation_type!: string;

//   @Column(DataType.DATE)
//   date_added!: Date;
// }
