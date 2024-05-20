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

const MyTreesModel = mongoose.model("mytrees", mytreesSchema);

MyTreesModel.createIndexes({ maxTimeMS: MONGO_CREATE_INDEX_MAX_TIMEOUT }); //create index

export default MyTreesModel;
