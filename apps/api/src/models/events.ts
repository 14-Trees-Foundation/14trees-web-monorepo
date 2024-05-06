import mongoose from "mongoose";
import { MONGO_CREATE_INDEX_MAX_TIMEOUT } from "../services/mongo";

const Schema = mongoose.Schema;

const eventSchema = new Schema({
  name: { type: String },
  assigned_by: { type: mongoose.Schema.Types.ObjectId, ref: "users" },
  assigned_to: [{ type: mongoose.Schema.Types.ObjectId, ref: "users" }],
  user_trees: [{ type: mongoose.Schema.Types.ObjectId, ref: "user_tree_reg" }],
  plot_id: { type: mongoose.Schema.Types.ObjectId, ref: "plots" },
  link: { type: String },
  type: { type: String },
  desc: { type: String },
  tags: [{ type: String }],
  date: { type: Date },
});

const eventModel = mongoose.model("events", eventSchema);

eventModel.createIndexes({ maxTimeMS: MONGO_CREATE_INDEX_MAX_TIMEOUT }); //create index

module.exports = eventModel;
