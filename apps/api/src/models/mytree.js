const mongoose = require("mongoose");

const Schema = mongoose.Schema;

var mytreesSchema = new Schema({
    user_id: { type: mongoose.Schema.Types.ObjectId, ref: 'users' },
    tree_id: { type: mongoose.Schema.Types.ObjectId, ref: 'trees' },
    assigned: { type: Boolean },
    assigned_to: { type: mongoose.Schema.Types.ObjectId, ref: 'users' },
    link: { type: String },
    type: { type: String },
    date_added: { type: Date },
    assigned_at: { type: Date },
});

const mytreesModel = mongoose.model("mytrees", mytreesSchema);

mytreesModel.createIndexes(); //create index

module.exports = mytreesModel;