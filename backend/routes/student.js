const express = require('express');
const router = express.Router();
const { protect, authorize } = require('../middleware/auth');
const Schedule = require('../models/Schedule');
const Course = require('../models/Course');
const User = require('../models/User');
const LabManual = require('../models/LabManual');

// GET /api/student/schedule
router.get('/schedule', protect, authorize('student'), async (req, res) => {
  try {
    // Find the student
    const student = await User.findById(req.user.id);
    if (!student) return res.status(404).json({ message: 'Student not found' });

    // Find courses the student is enrolled in (assuming batch/semester mapping)
    // If you have a student-course enrollment model, use that instead.
    const courses = await Course.find({
      // Example: filter by batch/semester if needed
      // batch: student.batch, semester: student.semester
    });

    const courseIds = courses.map(c => c._id);

    // Find schedule entries for these courses
    const schedule = await Schedule.find({ course: { $in: courseIds } })
      .populate('course', 'name code')
      .populate('faculty', 'name user_id');

    res.json(schedule);
  } catch (err) {
    res.status(500).json({ message: 'Failed to fetch schedule' });
  }
});

// GET /api/student/lab-manuals
router.get('/lab-manuals', protect, authorize('student'), async (req, res) => {
  try {
    const student = await User.findById(req.user.id);
    if (!student) return res.status(404).json({ message: 'Student not found' });

    // Find all faculty assigned to student's batch for each course
    const facultyList = await User.find({
      role: 'faculty',
      assignedCourseBatches: {
        $elemMatch: {
          course: { $in: student.assignedCourses || [] },
          batches: student.batch
        }
      }
    }).select('_id');
    const facultyIds = facultyList.map(f => f._id);

    // Find manuals uploaded by those faculty for student's courses
    const manuals = await LabManual.find({
      course: { $in: student.assignedCourses || [] },
      faculty: { $in: facultyIds }
    }).populate('course', 'name code');

    res.json(manuals);
  } catch (err) {
    res.status(500).json({ message: 'Failed to fetch manuals' });
  }
});

module.exports = router;
