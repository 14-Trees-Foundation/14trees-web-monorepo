import mongoose from "mongoose";
import { MONGO_CREATE_INDEX_MAX_TIMEOUT } from "../services/mongo";

const Schema = mongoose.Schema;

const mytreesSchema = new Schema({
  user_id: { type: mongoose.Schema.Types.ObjectId, ref: "users" },
  tree_id: { type: mongoose.Schema.Types.ObjectId, ref: "trees" },
  assigned: { type: Boolean },
  assigned_to: { type: mongoose.Schema.Types.ObjectId, ref: "users" },
  link: { type: String },
  type: { type: String },
  date_added: { type: Date },
  assigned_at: { type: Date },
});

const mytreesModel = mongoose.model("mytrees", mytreesSchema);

mytreesModel.createIndexes({ maxTimeMS: MONGO_CREATE_INDEX_MAX_TIMEOUT }); //create index

module.exports = mytreesModel;
