const mongoose = require('mongoose');

const QuestionSchema = new mongoose.Schema({
  title: String,
  description: String,
  expectedAnswer: String,
  topic: String,
  tags: [String],
  difficulty: { type: String, enum: ['Easy', 'Medium', 'Hard'] },
  marks: Number
});

const testSchema = new mongoose.Schema({
  name: { type: String, required: true },
  course: { type: mongoose.Schema.Types.ObjectId, ref: 'Course', required: true },
  questions: [QuestionSchema],
  numQuestions: { type: Number, default: 10 },
  date: { type: Date, required: true },
  duration: { type: Number },
  environmentSettings: { type: Object, default: {} },
  batches: [String],
  createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true }
});

module.exports = mongoose.model('Test', testSchema);
