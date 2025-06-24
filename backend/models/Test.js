const mongoose = require('mongoose');

const testSchema = new mongoose.Schema({
  name: { type: String, required: true },
  course: { type: mongoose.Schema.Types.ObjectId, ref: 'Course', required: true },
  questions: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Question' }],
  date: { type: Date, required: true },      // Date of the test
  time: { type: String, required: true },    // Time of the test (e.g., "10:00 AM - 12:00 PM")
  createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  metadata: { type: Object, default: {} }
});

module.exports = mongoose.model('Test', testSchema);
