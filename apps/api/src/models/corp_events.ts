import mongoose from "mongoose";
import { MONGO_CREATE_INDEX_MAX_TIMEOUT } from "../services/mongo";

const Schema = mongoose.Schema;

const corpEventSchema = new Schema({
  event_link: { type: String },
  event_name: { type: String },
  tree_ids: [{ type: mongoose.Schema.Types.ObjectId, ref: "trees" }],
  plot_id: { type: mongoose.Schema.Types.ObjectId, ref: "plots" },
  title: { type: String },
  logo: [{ type: String }],
  short_desc: { type: String },
  long_desc: { type: String },
  num_people: { type: String },
  header_img: { type: String },
  plot_desc: { type: String },
  album: [{ type: String }],
  plot_img: { type: String },
  date_added: { type: Date },
});

const CorpEventModel = mongoose.model("corp_events", corpEventSchema);

CorpEventModel.createIndexes({ maxTimeMS: MONGO_CREATE_INDEX_MAX_TIMEOUT }); //create index

export default CorpEventModel;
