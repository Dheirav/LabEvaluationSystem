const express = require('express');
const router = express.Router();
const { protect, authorize } = require('../middleware/auth');
const Test = require('../models/Test');
const StudentTestAttempt = require('../models/StudentTestAttempt');
const Schedule = require('../models/Schedule');
const Course = require('../models/Course');
const User = require('../models/User');
const LabManual = require('../models/LabManual');

// Utility to shuffle array
function shuffle(arr) {
  return arr.map(v => [Math.random(), v]).sort((a, b) => a[0] - b[0]).map(x => x[1]);
}

// GET /api/student/available-tests - List tests available for the logged-in student
router.get('/available-tests', protect, authorize('student'), async (req, res) => {
  try {
    const studentId = req.user._id;
    const user = await require('../models/User').findById(studentId);
    if (!user) return res.status(404).json({ message: 'Student not found' });
    // Find all test attempts by this student
    const attempts = await require('../models/StudentTestAttempt').find({ studentId });
    const attemptedTestIds = attempts.map(a => a.testId.toString());
    // Find tests for student's batches, not yet attempted, and date >= today
    const today = new Date();
    const Test = require('../models/Test');
    const tests = await Test.find({
      batches: { $in: [user.batch] },
      _id: { $nin: attemptedTestIds },
      date: { $gte: today }
    }).populate('course', 'name code');
    res.json(tests);
  } catch (err) {
    res.status(500).json({ message: 'Failed to fetch available tests', error: err.message });
  }
});
// PATCH /api/student/attempt/:attemptId - Save student answers
router.patch('/attempt/:attemptId', protect, authorize('student'), async (req, res) => {
  try {
    const { attemptId } = req.params;
    const { answers } = req.body;
    const attempt = await StudentTestAttempt.findById(attemptId);
    if (!attempt) return res.status(404).json({ message: 'Attempt not found' });
    // Only allow the student who owns the attempt
    if (attempt.studentId.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: 'Not authorized' });
    }
    if (!Array.isArray(answers) || answers.length !== attempt.questionIds.length) {
      return res.status(400).json({ message: 'Invalid answers array' });
    }
    attempt.answers = answers;
    attempt.endTime = new Date();
    await attempt.save();
    res.json({ message: 'Answers saved' });
  } catch (err) {
    res.status(500).json({ message: 'Failed to save answers', error: err.message });
  }
});

// Utility to shuffle array
function shuffle(arr) {
  return arr.map(v => [Math.random(), v]).sort((a, b) => a[0] - b[0]).map(x => x[1]);
}
// GET /api/student/start-test/:testId
router.get('/start-test/:testId', protect, authorize('student'), async (req, res) => {
  try {
    const { testId } = req.params;
    const studentId = req.user._id;
    // Check if attempt already exists
    let attempt = await StudentTestAttempt.findOne({ studentId, testId });
    if (attempt) {
      // Populate questions from test
      const test = await Test.findById(testId);
      const questions = test.questions.filter(q => attempt.questionIds.includes(q._id.toString()));
      return res.json({ attemptId: attempt._id, questions });
    }
    // Fetch test and questions
    const test = await Test.findById(testId);
    if (!test) return res.status(404).json({ message: 'Test not found' });
    const allQuestions = test.questions;
    // How many questions to pick? Use test.numQuestions or fallback
    const count = Math.min(test.numQuestions || 10, allQuestions.length);
    // Pick unique questions by tag set (stricter uniqueness)
    const seenTagSets = new Set();
    const selected = [];
    for (const q of shuffle(allQuestions)) {
      const tagSet = [...(q.tags || [])].sort().join('-');
      if (!seenTagSets.has(tagSet)) {
        selected.push(q);
        seenTagSets.add(tagSet);
      }
      if (selected.length === count) break;
    }
    if (selected.length < count) {
      return res.status(400).json({ 
        message: `Not enough unique questions for this test. Requested: ${count}, available: ${selected.length}. Please contact your instructor or try again later.` 
      });
    }
    // Save attempt
    attempt = new StudentTestAttempt({
      studentId,
      testId,
      questionIds: selected.map(q => q._id.toString()),
      answers: Array(selected.length).fill(''),
      startTime: new Date()
    });
    await attempt.save();
    res.json({ attemptId: attempt._id, questions: selected });
  } catch (err) {
    res.status(500).json({ message: 'Failed to start test', error: err.message });
  }
});


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

    // Use FacultyCourse as the source of truth for assignments
    const assignments = await require('../models/FacultyCourse').find({
      courseId: { $in: student.assignedCourses || [] },
      batch: student.batch
    });
    const facultyIds = assignments.map(a => a.facultyId);

    // Find manuals uploaded by those faculty for student's courses and batch
    const manuals = await LabManual.find({
      course: { $in: student.assignedCourses || [] },
      faculty: { $in: facultyIds },
      batch: student.batch
    }).populate('course', 'name code').populate('faculty', 'name');

    res.json(manuals);
  } catch (err) {
    res.status(500).json({ message: 'Failed to fetch manuals' });
  }
});

// GET /api/student/lab-manuals/:courseId - get study materials for a specific assigned course
router.get('/lab-manuals/:courseId', protect, authorize('student'), async (req, res) => {
  try {
    const { courseId } = req.params;
    const student = await User.findById(req.user.id);
    if (!student) return res.status(404).json({ message: 'Student not found' });
    // Only allow if course is assigned to student
    if (!student.assignedCourses.map(cid => cid.toString()).includes(courseId)) {
      return res.status(403).json({ message: 'You are not assigned to this course.' });
    }
    // Find all faculty assigned to student's batch for this course
    const facultyList = await User.find({
      role: 'faculty',
      assignedCourseBatches: {
        $elemMatch: {
          course: courseId,
          batches: student.batch
        }
      }
    }).select('_id');
    const facultyIds = facultyList.map(f => f._id);
    // Find manuals uploaded by those faculty for this course
    const manuals = await LabManual.find({
      course: courseId,
      faculty: { $in: facultyIds }
    }).populate('course', 'name code');
    res.json(manuals);
  } catch (err) {
    res.status(500).json({ message: 'Failed to fetch manuals for course' });
  }
});

// GET /api/student/courses - get all assigned courses for the logged-in student'
router.get('/courses', protect, authorize('student'), async (req, res) => {
  try {
    // Find the student
    const student = await User.findById(req.user.id).populate('assignedCourses');
    if (!student) return res.status(404).json({ message: 'Student not found' });
    // Return the assignedCourses array, populated
    res.json(student.assignedCourses || []);
  } catch (err) {
    console.error('Error fetching student assigned courses:', err);
    res.status(500).json({ message: 'Failed to fetch assigned courses' });
  }
});

module.exports = router;