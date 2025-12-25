const mongoose = require('mongoose');

const messageSchema = new mongoose.Schema({
  source: String,
  content: String,
  receivedAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model('Message', messageSchema);
