const mongoose = require("mongoose");

const Schema = mongoose.Schema;

let supporter = new Schema({
    name: { type: String, required: true },
    contact: { type: Number, required: true },
    email: { type: String, required: true },
    date_added: { type: Date }
});

const supporterModel = mongoose.model("supporters", supporter);
supporterModel.createIndexes(); //create index
module.exports = supporterModel;