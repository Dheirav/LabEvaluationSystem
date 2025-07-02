const mongoose = require('mongoose');

const questionSchema = new mongoose.Schema({
  course: { type: mongoose.Schema.Types.ObjectId, ref: 'Course', required: true },
  title: { type: String, required: true },
  description: { type: String }, // markdown or rich text
  expectedAnswer: { type: String },
  tags: [{ type: String }],
  details: { type: Object, default: {} }, // dynamic fields: testCases, scenario, constraints, etc.
  createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model('Question', questionSchema);
