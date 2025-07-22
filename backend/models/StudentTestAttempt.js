const mongoose = require('mongoose');

const studentTestAttemptSchema = new mongoose.Schema({
  studentId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  testId: { type: mongoose.Schema.Types.ObjectId, ref: 'Test', required: true },
  questionIds: [{ type: String, required: true }], // store question _id or inline id
  answers: [{ type: String }],
  startTime: { type: Date },
  endTime: { type: Date }
});

module.exports = mongoose.model('StudentTestAttempt', studentTestAttemptSchema);
