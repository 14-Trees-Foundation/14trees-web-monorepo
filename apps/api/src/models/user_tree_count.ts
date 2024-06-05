import mongoose from "mongoose";
import { MONGO_CREATE_INDEX_MAX_TIMEOUT } from "../services/mongo";

const Schema = mongoose.Schema;

const userTreeCountSchema = new Schema({
  count: { type: Number },
  tree_id: [{ type: mongoose.Schema.Types.ObjectId, ref: "trees" }],
  user: { name: { type: String }, email: { type: String } },
  plot: { name: { type: String }, plot_id: { type: String } },
  matched: { count: { type: Number } }
});

const UserTreeCountModel = mongoose.model("user_tree_counts", userTreeCountSchema);
UserTreeCountModel.createIndexes({ maxTimeMS: MONGO_CREATE_INDEX_MAX_TIMEOUT }); //create index

export default UserTreeCountModel;
