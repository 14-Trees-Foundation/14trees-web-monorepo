const mongoose = require("mongoose");

const Schema = mongoose.Schema;

var pondUpdate = new Schema({
  date: { type: Date },
  levelFt: { type: Number },
  user: { type: mongoose.Schema.Types.ObjectId, ref: "onsitestaffs" },
  images: [{type:String}]
});

var pondSchema = new Schema({
  name: { type: String, required: true },
  tags: [{ type: String }],
  desc: { type: String },
  type: {type: String},
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

PondModel.createIndexes(); //create index

module.exports = {PondModel, pondUpdate};
