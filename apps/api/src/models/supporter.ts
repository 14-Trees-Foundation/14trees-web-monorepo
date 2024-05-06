import mongoose from "mongoose";
import { MONGO_CREATE_INDEX_MAX_TIMEOUT } from "../services/mongo";

const Schema = mongoose.Schema;

const supporter = new Schema({
  name: { type: String, required: true },
  contact: { type: Number, required: true },
  email: { type: String, required: true },
  date_added: { type: Date },
});

const supporterModel = mongoose.model("supporters", supporter);
supporterModel.createIndexes({ maxTimeMS: MONGO_CREATE_INDEX_MAX_TIMEOUT }); //create index
module.exports = supporterModel;