const mongoose = require('mongoose');

const replySchema = new mongoose.Schema({
  text: String,
  delete_password: String,
  created_on: { type: Date, default: new Date() },
  reported: { type: Boolean, default: false }
});

const threadSchema = new mongoose.Schema({
  board: String,
  text: String,
  delete_password: String,
  created_on: { type: Date, default: new Date() },
  bumped_on: { type: Date, default: new Date() },
  reported: { type: Boolean, default: false },
  replies: [replySchema]
});

module.exports = mongoose.model('Thread', threadSchema);
