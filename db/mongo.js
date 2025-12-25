const mongoose = require('mongoose');
require('dotenv').config();

module.exports = {
  async connect() {
    const uri = process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/lab6_messages';
    return mongoose.connect(uri, { useNewUrlParser: true, useUnifiedTopology: true });
  }
};
