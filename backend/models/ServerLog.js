const mongoose = require('mongoose');

const serverLogSchema = new mongoose.Schema({
  timestamp: { type: Date, default: Date.now },
  user_id: { type: String },
  action: { type: String, required: true },
  details: { type: String },
  ip: { type: String },           
  system_id: { type: String }     
});
module.exports = mongoose.model('ServerLog', serverLogSchema);