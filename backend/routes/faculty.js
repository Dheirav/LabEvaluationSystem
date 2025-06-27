const express = require('express');
const router = express.Router();
const { protect, authorize } = require('../middleware/auth');

// Replace with your actual models
const Course = require('../models/Course');
const Evaluation = require('../models/Evaluation');
const User = require('../models/User');
const Schedule = require('../models/Schedule');
const QuestionPool = require('../models/QuestionPool');
const LabManual = require('../models/LabManual');
const multer = require('multer');
const path = require('path');

// Multer storage for lab manuals
const manualStorage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, path.join(__dirname, '..', 'uploads', 'labmanuals'));
  },
  filename: function (req, file, cb) {
    const unique = Date.now() + '-' + Math.round(Math.random() * 1e9);
    cb(null, unique + '-' + file.originalname);
  }
});
const manualUpload = multer({ storage: manualStorage });

// Hardcoded course-semester mapping
const courseSemesterMap = {
  'Programming in C': 1,
  'Computational Thinking': 1,
  'Object Oriented Programming': 2,
  'Data Structures': 3,
  'Digital System Design': 3,
  'Java Programming': 3,
  'Database Management Systems': 4,
  'Computer Architecture': 4,
  'Full Stack Technologies': 4,
  'Operating Systems': 5,
  'Networks and Data Communication': 5,
  'Cryptography and System Security': 6,
  'Compiler Design': 6,
  'Machine Learning': 6,
  'Creative and Innovative Project': 6,
  'Project Work / Internship': 8
};

// Get courses assigned to the faculty
router.get('/courses', protect, authorize('faculty'), async (req, res) => {
  // Only return courses assigned to this faculty (from assignedCourses)
  const faculty = await User.findById(req.user.id).populate({
    path: 'assignedCourses',
    select: 'name code'
  });
  res.json(faculty.assignedCourses || []);
});

// Get evaluations/tests to grade
router.get('/evaluations', protect, authorize('faculty'), async (req, res) => {
  const evaluations = await Evaluation.find({ faculty: req.user.id });
  res.json(evaluations);
});

// Get students in faculty’s courses/batches
router.get('/students', protect, authorize('faculty'), async (req, res) => {
  // Example: find students enrolled in courses taught by this faculty
  const courses = await Course.find({ faculty: req.user.id });
  const courseIds = courses.map(c => c._id);
  const students = await User.find({ role: 'student', course: { $in: courseIds } });
  res.json(students);
});

// GET /api/faculty/students - grouped by course+batch
router.get('/students', protect, authorize('faculty'), async (req, res) => {
  try {
    // Get faculty's assignedCourseBatches with course populated
    const faculty = await User.findById(req.user.id)
      .populate({
        path: 'assignedCourseBatches.course',
        select: 'name'
      })
      .lean();

    if (!faculty || !Array.isArray(faculty.assignedCourseBatches)) {
      return res.json([]);
    }

    // Build result: [{ courseName, semester, students: [...] }]
    const result = [];

    for (const acb of faculty.assignedCourseBatches) {
      const courseObj = acb.course && typeof acb.course === 'object' ? acb.course : null;
      if (!courseObj || !Array.isArray(acb.batches)) continue;

      const courseName = courseObj.name;
      const semester = courseSemesterMap[courseName] || null;

      for (const batch of acb.batches) {
        // Find students for this batch and semester
        const students = await User.find({
          role: 'student',
          batch,
          semester,
        }).select('name roll_number batch semester department').lean();

        result.push({
          courseName,
          semester,
          batch,
          students
        });
      }
    }

    res.json(result);
  } catch (err) {
    console.error('faculty/students error:', err);
    res.status(500).json({ message: 'Failed to fetch students' });
  }
});

// Get faculty’s schedule/timetable
router.get('/schedule', protect, authorize('faculty'), async (req, res) => {
  const schedule = await Schedule.find({ faculty: req.user.id });
  res.json(schedule);
});

// Get question pool (courses > tests > questions)
router.get('/question-pool', protect, authorize('faculty'), async (req, res) => {
  const courses = await Course.find({ faculty: req.user.id }).populate({
    path: 'tests',
    populate: { path: 'questions' }
  });
  res.json(courses);
});

// Upload lab manual (secure: only for assigned course-batch pairs)
router.post('/lab-manuals/upload', protect, authorize('faculty'), manualUpload.single('file'), async (req, res) => {
  try {
    const { course, batch, title } = req.body;
    if (!req.file) return res.status(400).json({ message: 'No file uploaded' });
    if (!course || !batch) return res.status(400).json({ message: 'Course and batch are required' });

    // Validate: faculty can only upload for assigned course-batch
    const faculty = await User.findById(req.user.id);
    const found = (faculty.assignedCourseBatches || []).find(
      acb =>
        acb.course.toString() === course &&
        Array.isArray(acb.batches) &&
        acb.batches.includes(batch)
    );
    if (!found) {
      return res.status(403).json({ message: 'You are not assigned to this course and batch.' });
    }

    // Optionally: check course exists
    const courseObj = await Course.findById(course);
    if (!courseObj) return res.status(400).json({ message: 'Invalid course.' });

    // Save manual
    const manual = new LabManual({
      course,
      faculty: req.user.id,
      filename: req.file.filename,
      originalname: req.file.originalname,
      batch,
      title: title || req.file.originalname
    });
    await manual.save();
    res.json({ message: 'Lab manual uploaded', manual });
  } catch (err) {
    res.status(500).json({ message: 'Upload failed', error: err.message });
  }
});

// List lab manuals for faculty
router.get('/lab-manuals', protect, authorize('faculty'), async (req, res) => {
  try {
    const manuals = await LabManual.find({ faculty: req.user.id }).populate('course', 'name code');
    res.json(manuals);
  } catch (err) {
    res.status(500).json({ message: 'Failed to fetch manuals' });
  }
});

// Add/edit/delete question pool endpoints as needed...

module.exports = router;
