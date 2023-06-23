const mongoose = require("mongoose");

const Schema = mongoose.Schema;

var plotSchema = new Schema({
    name: { type: String, required: true },
    plot_id: { type: String, required: true, index: true, unique: true },
    tags: [{ type: String }],
    desc: { type: String },
    boundaries: {
        type: { type: String, default: 'Polygon' },
        coordinates: { type: [[[Number]]] }
    },
    center: {
        type: { type: String, default: 'Point' },
        coordinates: { type: [Number], default: [0, 0] }
    },
    date_added: { type: Date }
});

const plotModel = mongoose.model("plots", plotSchema);

plotModel.createIndexes(); //create index

module.exports = plotModel;