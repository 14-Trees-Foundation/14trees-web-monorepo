import mongoose from "mongoose";
import { MONGO_CREATE_INDEX_MAX_TIMEOUT } from "../services/mongo";

const Schema = mongoose.Schema;

const updateSchema = new Schema({
  image: { type: String },
  date_added: { type: Date },
});

const treePhotoUpdateSchema = new Schema({
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

treeUpdatePhotoModel.createIndexes({
  maxTimeMS: MONGO_CREATE_INDEX_MAX_TIMEOUT,
}); //create index

module.exports = treeUpdatePhotoModel;