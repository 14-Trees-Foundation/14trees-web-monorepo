const mongoose = require("mongoose");

const Schema = mongoose.Schema;

var corpEventSchema = new Schema({
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

const corpEventModel = mongoose.model("corp_events", corpEventSchema);

corpEventModel.createIndexes(); //create index

module.exports = corpEventModel;
