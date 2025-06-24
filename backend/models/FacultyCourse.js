const mongoose = require('mongoose');

const facultyCourseSchema = new mongoose.Schema({
  facultyId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  courseId: { type: mongoose.Schema.Types.ObjectId, ref: 'Course', required: true },
  batch: { type: String, required: true },
  semester: { type: String, required: true },
  assignedDate: { type: Date, default: Date.now }
});

module.exports = mongoose.model('FacultyCourse', facultyCourseSchema);
