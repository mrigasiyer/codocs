const mongoose = require("mongoose");

const ydocSchema = new mongoose.Schema({
  room: { type: String, required: true, unique: true },
  state: { type: Buffer, required: true }, // store as binary
});

module.exports = mongoose.model("YDoc", ydocSchema);
