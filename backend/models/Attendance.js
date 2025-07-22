const mongoose = require('mongoose');

const attendanceSchema = new mongoose.Schema({
  timestamp: { type: Date, default: Date.now },
  user_id: { type: String, required: true },
  action: { type: String, enum: ['login', 'logout'], required: true },
  details: { type: String },
  ip: { type: String },
  system_id: { type: String },
  durationMinutes: { type: Number }
});

module.exports = mongoose.model('Attendance', attendanceSchema);
