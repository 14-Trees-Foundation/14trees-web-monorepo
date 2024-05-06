import mongoose from "mongoose";
import { MONGO_CREATE_INDEX_MAX_TIMEOUT } from "../services/mongo";

const Schema = mongoose.Schema;

const treeTypeSchema = new Schema({
  name: { type: String, required: true },
  scientific_name: { type: String },
  tree_id: { type: String, equired: true, index: true, unique: true },
  image: [{ type: String }],
  family: { type: String },
  habit: { type: String },
  remarkable_char: { type: String },
  med_use: { type: String },
  other_use: { type: String },
  food: { type: String },
  eco_value: { type: String },
  parts_userd: { type: String },
  tags: [{ type: String }],
  desc: { type: String },
});

const treeTypeModel = mongoose.model("tree_type", treeTypeSchema);

treeTypeModel.createIndexes({ maxTimeMS: MONGO_CREATE_INDEX_MAX_TIMEOUT }); //create index

module.exports = treeTypeModel;
