import mongoose from "mongoose";
import { MONGO_CREATE_INDEX_MAX_TIMEOUT } from "../services/mongo";

const Schema = mongoose.Schema;

const pondUpdate = new Schema({
  date: { type: Date },
  levelFt: { type: Number },
  user: { type: mongoose.Schema.Types.ObjectId, ref: "onsitestaffs" },
  images: [{ type: String }],
});

const pondSchema = new Schema({
  name: { type: String, required: true },
  tags: [{ type: String }],
  desc: { type: String },
  type: { type: String },
  boundaries: {
    type: { type: String, default: "Polygon" },
    coordinates: { type: [[[Number]]] },
  },
  date_added: { type: Date },
  images: [{ type: String }],
  lengthFt: { type: Number },
  widthFt: { type: Number },
  depthFt: { type: Number },
  updates: [pondUpdate],
});

const PondModel = mongoose.model("ponds", pondSchema);

PondModel.createIndexes({ maxTimeMS: MONGO_CREATE_INDEX_MAX_TIMEOUT }); //create index

export { PondModel, pondUpdate };
