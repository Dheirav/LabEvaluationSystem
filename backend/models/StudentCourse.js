const mongoose = require('mongoose');

const studentCourseSchema = new mongoose.Schema({
  studentId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  courseId: { type: mongoose.Schema.Types.ObjectId, ref: 'Course', required: true },
  assignedDate: { type: Date, default: Date.now }
});

module.exports = mongoose.model('StudentCourse', studentCourseSchema);
