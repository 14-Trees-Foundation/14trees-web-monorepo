import mongoose from "mongoose";
import { MONGO_CREATE_INDEX_MAX_TIMEOUT } from "../services/mongo";

const Schema = mongoose.Schema;

const albumsSchema = new Schema({
  user_id: { type: mongoose.Schema.Types.ObjectId, ref: "users" },
  album_name: { type: String },
  images: [{ type: String }],
  date_added: { type: Date },
  status: { type: String, default: "active" },
});

const AlbumModel = mongoose.model("albums", albumsSchema);

AlbumModel.createIndexes({maxTimeMS: MONGO_CREATE_INDEX_MAX_TIMEOUT}); //create index

export default AlbumModel;