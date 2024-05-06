import mongoose from "mongoose";
// import { MONGO_CREATE_INDEX_MAX_TIMEOUT } from "../services/mongo";

const Schema = mongoose.Schema;

let onsitestaff = new Schema({
  name: { type: String, required: true },
  user_id: { type: String },
  phone: { type: Number },
  image: { type: String },
  email: { type: String, unique: true },
  role: { type: String },
  permissions: [{ type: String }],
  dob: { type: Date },
  date_added: { type: Date },
});

const onSiteStaff = mongoose.model("onsitestaffs", onsitestaff);
// onSiteStaff.createIndexes({maxTimeMS: MONGO_CREATE_INDEX_MAX_TIMEOUT}); //create index
module.exports = onSiteStaff;
