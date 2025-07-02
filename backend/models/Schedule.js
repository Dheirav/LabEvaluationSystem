const mongoose = require('mongoose');

const scheduleSchema = new mongoose.Schema({
  faculty: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  course: { type: mongoose.Schema.Types.ObjectId, ref: 'Course', required: true },
  date: { type: Date, required: true },
  time: { type: String, required: true },
  type: { type: String, enum: ['lab', 'evaluation', 'lecture', 'test', 'exercise'], default: 'lab' },
  title: { type: String },
  description: { type: String }
});

module.exports = mongoose.model('Schedule', scheduleSchema);
