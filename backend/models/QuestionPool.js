const mongoose = require('mongoose');

// A QuestionPool can be a collection of questions for a course/test
const questionPoolSchema = new mongoose.Schema({
  course: { type: mongoose.Schema.Types.ObjectId, ref: 'Course', required: true },
  test: { type: mongoose.Schema.Types.ObjectId, ref: 'Test' }, // optional, if pooling by test
  questions: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Question' }],
  createdAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model('QuestionPool', questionPoolSchema);
