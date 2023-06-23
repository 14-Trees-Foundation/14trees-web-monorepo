const mongoose = require("mongoose");

const Schema = mongoose.Schema;

let userTree = new Schema({
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
});

const userTreeModel = mongoose.model("user_tree_reg", userTree);
module.exports = userTreeModel;
