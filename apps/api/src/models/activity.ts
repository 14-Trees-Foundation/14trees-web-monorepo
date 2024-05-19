import mongoose from "mongoose";
import { MONGO_CREATE_INDEX_MAX_TIMEOUT } from "../services/mongo";

const Schema = mongoose.Schema;

const activitySchema = new Schema({
    title: {type: String, required: true},
    type: {type: String, required: true},
    date: {type: Date, required: true},
    desc: {type: String, required: true},
    author: {type: String},
    images: [{type: String}],
    video: {type: String}
});

const activityModel = mongoose.model("activities", activitySchema);

activityModel.createIndexes({maxTimeMS: MONGO_CREATE_INDEX_MAX_TIMEOUT}); //create index

export default activityModel;