const mongoose = require('mongoose');

const questionSchema = new mongoose.Schema({
  course: { type: mongoose.Schema.Types.ObjectId, ref: 'Course', required: true },
  title: { type: String, required: true },
  description: { type: String },
  expectedAnswer: { type: String },
  topic: { type: String },
  tags: [{ type: String }],
  difficulty: { type: String, enum: ['Easy', 'Medium', 'Hard'] },
  marks: { type: Number },
  details: { type: Object, default: {} },
  createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model('Question', questionSchema);
