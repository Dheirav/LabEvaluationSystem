const express = require('express');
const router = express.Router();
const { protect, authorize } = require('../middleware/auth');

// Replace with your actual models
const Course = require('../models/Course');
const Evaluation = require('../models/Evaluation');
const User = require('../models/User');
const Schedule = require('../models/Schedule');
const QuestionPool = require('../models/QuestionPool');

// Get courses assigned to the faculty
router.get('/courses', protect, authorize('faculty'), async (req, res) => {
  // Example: find courses where faculty field matches logged-in user
  const courses = await Course.find({ faculty: req.user.id });
  res.json(courses);
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

// Add/edit/delete question pool endpoints as needed...

module.exports = router;
