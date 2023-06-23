const mongoose = require("mongoose");

const Schema = mongoose.Schema;

var orgSchema = new Schema({
    name: { type: String, required: true, unique: true },
    type: { type: String, },
    desc: { type: String },
    date_added: { type: Date },

});

const orgModel = mongoose.model("organizations", orgSchema);

orgModel.createIndexes(); //create index

module.exports = orgModel;