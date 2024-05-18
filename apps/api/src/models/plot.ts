import mongoose from "mongoose";
import { MONGO_CREATE_INDEX_MAX_TIMEOUT } from "../services/mongo";

const Schema = mongoose.Schema;

const plotSchema = new Schema({
  name: { type: String, required: true },
  plot_id: { type: String, required: true, index: true, unique: true },
  tags: [{ type: String }],
  desc: { type: String },
  boundaries: {
    type: { type: String, default: "Polygon" },
    coordinates: { type: [[[Number]]] },
  },
  center: {
    type: { type: String, default: "Point" },
    coordinates: { type: [Number], default: [0, 0] },
  },
  date_added: { type: Date },
});

const plotModel = mongoose.model("plots", plotSchema);

plotModel.createIndexes({ maxTimeMS: MONGO_CREATE_INDEX_MAX_TIMEOUT }); //create index

export default  plotModel;
