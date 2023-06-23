const mongoose = require("mongoose");

const Schema = mongoose.Schema;

var eventSchema = new Schema({
    name: { type: String },
    assigned_by: { type: mongoose.Schema.Types.ObjectId, ref: 'users' },
    assigned_to: [{ type: mongoose.Schema.Types.ObjectId, ref: 'users' }],
    user_trees: [{ type: mongoose.Schema.Types.ObjectId, ref: 'user_tree_reg' }],
    plot_id: { type: mongoose.Schema.Types.ObjectId, ref: 'plots' },
    link: { type: String },
    type: { type: String },
    desc: { type: String },
    tags: [{ type: String }],
    date: { type: Date },
});

const eventModel = mongoose.model("events", eventSchema);

eventModel.createIndexes(); //create index

module.exports = eventModel;