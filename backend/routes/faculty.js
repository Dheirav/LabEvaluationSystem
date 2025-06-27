const express = require('express');
const router = express.Router();
const { protect, authorize } = require('../middleware/auth');

// Replace with your actual models
const Course = require('../models/Course');
const Evaluation = require('../models/Evaluation');
const User = require('../models/User');
const FacultyCourse = require('../models/FacultyCourse');
const Schedule = require('../models/Schedule');
const QuestionPool = require('../models/QuestionPool');

// Get courses assigned to the faculty
router.get('/courses', protect, authorize('faculty'), async (req, res) => {
  try {
    const facultyCourses = await FacultyCourse.find({ facultyId: req.user.id }).populate('courseId', 'name code');
    const courses = facultyCourses.map(fc => fc.courseId);
    res.json(courses);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
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

// Grade an evaluation
router.put('/evaluations/:id/grade', protect, authorize('faculty'), async (req, res) => {
  try {
    const evaluation = await Evaluation.findById(req.params.id);

    if (!evaluation) {
      return res.status(404).json({ message: 'Evaluation not found' });
    }

    if (evaluation.faculty.toString() !== req.user.id) {
      return res.status(403).json({ message: 'Not authorized to grade this evaluation' });
    }

    evaluation.marks = req.body.marks;
    evaluation.status = 'graded'; // Or 'completed'
    await evaluation.save();

    res.json({ message: 'Evaluation graded successfully' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Create a new question
router.post('/questions', protect, authorize('faculty'), async (req, res) => {
  try {
    const { text, test } = req.body;

    const newQuestion = new Question({
      text,
      test
    });

    const question = await newQuestion.save();

    // Update the Test model to include the new question
    const testObj = await Test.findById(test);
    if (testObj) {
      testObj.questions.push(question._id);
      await testObj.save();
    }

    res.status(201).json({ message: 'Question created successfully', question });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Get reports
router.get('/reports', protect, authorize('faculty'), async (req, res) => {
  try {
    const { course, type } = req.query;

    if (!course || !type) {
      return res.status(400).json({ message: 'Course and report type are required' });
    }

    let reportData = [];

    switch (type) {
      case 'performance':
        // Fetch class performance data
        const courseObj = await Course.findById(course).populate('evaluations');
        if (!courseObj) {
          return res.status(404).json({ message: 'Course not found' });
        }

        const evaluations = courseObj.evaluations;
        let totalMarks = 0;
        evaluations.forEach(ev => {
          totalMarks += ev.marks || 0;
        });
        const averageMarks = evaluations.length > 0 ? totalMarks / evaluations.length : 0;

        // Assuming pass mark is 40
        const passPercentage = evaluations.filter(ev => ev.marks >= 40).length / evaluations.length * 100;

        reportData = [{ averageMarks, passPercentage }];
        break;
      case 'progress':
        // Fetch student progress data
        const courseObj2 = await Course.findById(course).populate({
          path: 'students',
          populate: { path: 'evaluations' }
        });
        if (!courseObj2) {
          return res.status(404).json({ message: 'Course not found' });
        }

        reportData = courseObj2.students.map(student => {
          return {
            student: student.name,
            evaluations: student.evaluations.map(ev => ({
              test: ev.name,
              marks: ev.marks
            }))
          };
        });
        break;
      case 'attendance':
        // Fetch attendance data
        const courseObj3 = await Course.findById(course).populate('students');
        if (!courseObj3) {
          return res.status(404).json({ message: 'Course not found' });
        }

        reportData = courseObj3.students.map(student => {
          // Assuming attendance is stored in student model
          return {
            student: student.name,
            attended: student.attended || 0,
            total: student.totalClasses || 0,
            percentage: student.attended / student.totalClasses * 100 || 0
          };
        });
        break;
      default:
        return res.status(400).json({ message: 'Invalid report type' });
    }

    res.json(reportData);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Add/edit/delete question pool endpoints as needed...

module.exports = router;
