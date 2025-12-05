const mongoose = require('mongoose');

const replySchema = new mongoose.Schema({
  text: String,
  delete_password: String,
  created_on: Date,
  reported: Boolean
});

module.exports = mongoose.model('Reply', replySchema);
