const mongoose = require("mongoose");

const Schema = mongoose.Schema;

const updateSchema = new Schema({
  image: { type: String },
  date_added: { type: Date },
});

var treePhotoUpdateSchema = new Schema({
  tree_id: { type: mongoose.Schema.Types.ObjectId, ref: "trees" },
  photo_update: [
    {
      type: updateSchema,
      required: true,
    },
  ],
});

const treeUpdatePhotoModel = mongoose.model(
  "tree_update_photos",
  treePhotoUpdateSchema
);

treeUpdatePhotoModel.createIndexes(); //create index

module.exports = treeUpdatePhotoModel;
