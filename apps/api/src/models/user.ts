import mongoose from "mongoose";
import { MONGO_CREATE_INDEX_MAX_TIMEOUT } from "../services/mongo";

const Schema = mongoose.Schema;

const user = new Schema({
  name: { type: String, required: true },
  userid: { type: String, required: true, index: true, unique: true },
  phone: { type: Number },
  email: { type: String },
  dob: { type: Date },
  date_added: { type: Date },
});

const userModel = mongoose.model("users", user);
userModel.createIndexes({ maxTimeMS: MONGO_CREATE_INDEX_MAX_TIMEOUT }); //create index
module.exports = userModel;