const mongoose = require("mongoose");

const Schema = mongoose.Schema;

var activitySchema = new Schema({
    title: {type: String, required: true},
    type: {type: String, required: true},
    date: {type: Date, required: true},
    desc: {type: String, required: true},
    author: {type: String},
    images: [{type: String}],
    video: {type: String}
});

const activityModel = mongoose.model("activities", activitySchema);

activityModel.createIndexes(); //create index

module.exports = activityModel;