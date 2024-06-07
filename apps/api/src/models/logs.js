import mongoose from "mongoose";
import { MONGO_CREATE_INDEX_MAX_TIMEOUT } from "../services/mongo";

const Schema = mongoose.Schema;

const logsSchema = new Schema({
    userid: String,
    deviceinfo: { type: String, required: true },
    phoneinfo: { type: String, required: true },
    logs: { type: String, required: true, },
    timestamp: { type: String, required: true }
});

const LogsModel = mongoose.model("logsInfo", logsSchema);

LogsModel.createIndexes({ maxTimeMS: MONGO_CREATE_INDEX_MAX_TIMEOUT }); //create index

export default LogsModel;
