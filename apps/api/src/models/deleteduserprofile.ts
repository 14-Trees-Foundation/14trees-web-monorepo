import mongoose from "mongoose";

const Schema = mongoose.Schema;

const userTree = new Schema({
  tree: { type: mongoose.Schema.Types.ObjectId, ref: "trees" },
  user: { type: mongoose.Schema.Types.ObjectId, ref: "users" },
  orgid: { type: mongoose.Schema.Types.ObjectId, ref: "organizations" },
  donated_by: { type: mongoose.Schema.Types.ObjectId, ref: "users" },
  profile_image: [{ type: String }],
  gifted_by: { type: String },
  planted_by: { type: String },
  memories: [{ type: String }],
  plantation_type: { type: String },
  date_added: { type: Date },
  date_deleted: { type: Date },
});

const DeletedUserTreeModel = mongoose.model("deleted_user_tree_reg", userTree);
export default DeletedUserTreeModel;
