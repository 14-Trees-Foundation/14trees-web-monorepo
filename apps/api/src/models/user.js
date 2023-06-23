const mongoose = require("mongoose");

const Schema = mongoose.Schema;

let user = new Schema({
    name: { type: String, required: true },
    userid: { type: String, required: true, index: true, unique: true },
    phone: { type: Number },
    email: { type: String },
    dob: { type: Date },
    date_added: { type: Date }
});

const userModel = mongoose.model("users", user);
userModel.createIndexes(); //create index
module.exports = userModel;