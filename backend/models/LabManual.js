const mongoose = require('mongoose');

const labManualSchema = new mongoose.Schema({
  course: { type: mongoose.Schema.Types.ObjectId, ref: 'Course', required: true },
  faculty: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  filename: { type: String, required: true },
  originalname: { type: String, required: true },
  uploadDate: { type: Date, default: Date.now },
  batch: { type: String, enum: ['N', 'P', 'Q'], required: true },
  title: { type: String }
});

module.exports = mongoose.model('LabManual', labManualSchema);
