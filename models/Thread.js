const mongoose = require('mongoose');

const replySchema = new mongoose.Schema({
  text: String,
  delete_password: String,
  created_on: Date,
  reported: Boolean
});

const threadSchema = new mongoose.Schema({
  board: String,
  text: String,
  delete_password: String,
  created_on: Date,
  bumped_on: Date,
  reported: Boolean,
  replies: [replySchema]
});

module.exports = mongoose.model('Thread', threadSchema);
