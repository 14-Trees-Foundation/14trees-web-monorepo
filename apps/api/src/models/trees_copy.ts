
import mongoose from "mongoose";
import { MONGO_CREATE_INDEX_MAX_TIMEOUT } from "../services/mongo";

const Schema = mongoose.Schema;

const treesCopySchema = new Schema({
  sapling_id: { type: String, required: true, index: true, unique: true },
  tree_id: { type: mongoose.Schema.Types.ObjectId, ref: "tree_type" },
  plot_id: { type: mongoose.Schema.Types.ObjectId, ref: "plots" },
  user_id: { type: mongoose.Schema.Types.ObjectId, ref: "onsitestaffs" },
  image: [{ type: String }],
  height: { type: Number },
  date_added: { type: Date },
  tags: [{ type: String }],
  location: {
    type: { type: String, default: "Point" },
    coordinates: { type: [Number], default: [0, 0] },
  },
  mapped_to: { type: mongoose.Schema.Types.ObjectId, ref: "users" },
  link: { type: String },
  event_type: { type: String },
  desc: { type: String },
  date_assigned: { type: Date },
  tree: {
    name: { type: String },
  },
  plot: {
    name: { type: String },
  },
  user: {
    name: { type: String },
  },
  assigned_to: {
    user: { type: mongoose.Schema.Types.ObjectId, ref: "users" },
  }
});

const TreesCopyModel = mongoose.model("trees_copy", treesCopySchema);

TreesCopyModel.createIndexes({ maxTimeMS: MONGO_CREATE_INDEX_MAX_TIMEOUT }); //create index

export default TreesCopyModel;
