import mongoose from "mongoose";
import { MONGO_CREATE_INDEX_MAX_TIMEOUT } from "../services/mongo";

const Schema = mongoose.Schema;

const shiftSchema = new Schema({
    start_time: { type: String },
    end_time: { type: String },
    //shift_ID: { type: String }, //unique : true is removed
    user_id: { type: mongoose.Schema.Types.ObjectId, ref: 'onsitestaffs' },
    saplings: [{
        _id: false, // Exclude _id field from subdocuments
        sapling_id: { type: String },
        sequence_no: { type: String }
    }],
    shift_type: { type: String },
    plot_selected: { type: String },
    time_taken: { type: String },
    trees_planted: { type: String },
    timestamp: { type: String },
});

const ShiftModel = mongoose.model("shifts", shiftSchema);

ShiftModel.createIndexes({ maxTimeMS: MONGO_CREATE_INDEX_MAX_TIMEOUT }); //create index

export default ShiftModel;