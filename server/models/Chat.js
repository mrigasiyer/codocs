const mongoose = require("mongoose");

const MessageSchema = new mongoose.Schema({
  roomName: {
    type: String,
    required: true,
    trim: true,
  },
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: true,
  },
  username: {
    type: String,
    required: true,
  },
  displayName: {
    type: String,
  },
  message: {
    type: String,
    required: true,
    trim: true,
  },
  timestamp: {
    type: Date,
    default: Date.now,
  },
});

// Index for efficient querying by room name and timestamp
MessageSchema.index({ roomName: 1, timestamp: 1 });

module.exports = mongoose.model("Message", MessageSchema);
