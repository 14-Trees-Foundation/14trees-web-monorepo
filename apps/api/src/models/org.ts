import mongoose from "mongoose";
import { MONGO_CREATE_INDEX_MAX_TIMEOUT } from "../services/mongo";

const Schema = mongoose.Schema;

var orgSchema = new Schema({
  name: { type: String, required: true, unique: true },
  type: { type: String },
  desc: { type: String },
  date_added: { type: Date },
});

const OrgModel = mongoose.model("organizations", orgSchema);

OrgModel.createIndexes({ maxTimeMS: MONGO_CREATE_INDEX_MAX_TIMEOUT }); //create index

export default OrgModel;
