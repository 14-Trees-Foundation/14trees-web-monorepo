const mongoose = require("mongoose");

const Schema = mongoose.Schema;

var albuumsSchema = new Schema({
  user_id: { type: mongoose.Schema.Types.ObjectId, ref: "users" },
  album_name: { type: String },
  images: [{ type: String }],
  date_added: { type: Date },
  status: { type: String, default: "active" },
});

const abumsModel = mongoose.model("albums", albuumsSchema);

abumsModel.createIndexes(); //create index

module.exports = abumsModel;
