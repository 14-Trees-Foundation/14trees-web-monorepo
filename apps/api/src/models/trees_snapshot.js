const mongoose = require("mongoose");
import { MONGO_CREATE_INDEX_MAX_TIMEOUT } from "../services/mongo";

const Schema = mongoose.Schema;

let treesSnapshotSchema = new Schema({
    user_id: { type: mongoose.Schema.Types.ObjectId, ref: 'onsitestaffs' },
    sapling_id: { type: String },
    image: { type: String },
    timestamp: { type: String },
    date_added: { type: Date },
});

const TreesSnapshotModel = mongoose.model("trees_snapshot", treesSnapshotSchema);

TreesSnapshotModel.createIndexes({ maxTimeMS: MONGO_CREATE_INDEX_MAX_TIMEOUT }); //create index

export default TreesSnapshotModel;