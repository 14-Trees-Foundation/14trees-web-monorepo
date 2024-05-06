import mongoose from "mongoose";
import { MONGO_CREATE_INDEX_MAX_TIMEOUT } from "../services/mongo";

const Schema = mongoose.Schema;

const albuumsSchema = new Schema({
  user_id: { type: mongoose.Schema.Types.ObjectId, ref: "users" },
  album_name: { type: String },
  images: [{ type: String }],
  date_added: { type: Date },
  status: { type: String, default: "active" },
});

const abumsModel = mongoose.model("albums", albuumsSchema);

abumsModel.createIndexes({maxTimeMS: MONGO_CREATE_INDEX_MAX_TIMEOUT}); //create index

module.exports = abumsModel;