const express = require('express');
const router = express.Router();
const { protect, authorize } = require('../middleware/auth');
const Course = require('../models/Course');
const Evaluation = require('../models/Evaluation');
const User = require('../models/User');
const FacultyCourse = require('../models/FacultyCourse');
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
const Question = require('../models/Question');
const { Parser } = require('json2csv');
const ExcelJS = require('exceljs');
const PDFDocument = require('pdfkit');
const Test = require('../models/Test');

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

// Get all assignments for the faculty, and for each, the students in that batch/semester
router.get('/students', protect, authorize('faculty'), async (req, res) => {
  try {
    // Get all assignments for this faculty
    const assignments = await FacultyCourse.find({ facultyId: req.user.id }).populate('courseId');
    const result = [];
    for (const assign of assignments) {
      // Find students for this batch and semester
      const students = await User.find({
        role: 'student',
        batch: assign.batch,
        semester: Number(assign.semester)
      });
      result.push({
        assignmentId: assign._id,
        course: assign.courseId,
        batch: assign.batch,
        semester: assign.semester,
        students
      });
    }
    res.json(result);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
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
});

// Get all courses with parameters for dynamic question forms
router.get('/question-courses', protect, authorize('faculty'), async (req, res) => {
  try {
    const courses = await Course.find();
    res.json(courses);
  } catch (error) {
    res.status(500).json({ message: 'Error fetching courses' });
  }
});

// Get all questions (with filters, search, sort, pagination)
router.get('/questions', protect, authorize('faculty'), async (req, res) => {
  try {
    const { course, search, sort = 'createdAt', order = 'desc', page = 1, limit = 10 } = req.query;
    const filter = {};
    if (course) filter.course = course;
    if (search) filter.$or = [
      { title: { $regex: search, $options: 'i' } },
      { description: { $regex: search, $options: 'i' } }
    ];
    const skip = (parseInt(page) - 1) * parseInt(limit);
    const questions = await Question
      .find(filter)
      .sort({ [sort]: order === 'desc' ? -1 : 1 })
      .skip(skip)
      .limit(parseInt(limit));
    const total = await Question.countDocuments(filter);
    res.json({ questions, total });
  } catch (error) {
    res.status(500).json({ message: 'Error fetching questions' });
  }
});

// Add a new question
router.post('/questions', protect, authorize('faculty'), async (req, res) => {
  try {
    const { course, title, description, expectedAnswer, tags, details } = req.body;
    const question = new Question({
      course,
      title,
      description,
      expectedAnswer,
      tags,
      details,
      createdBy: req.user._id
    });
    await question.save();
    res.status(201).json({ message: 'Question created', question });
  } catch (error) {
    res.status(500).json({ message: 'Error creating question' });
  }
});

// Edit a question
router.put('/questions/:id', protect, authorize('faculty'), async (req, res) => {
  try {
    const { title, description, expectedAnswer, tags, details } = req.body;
    const question = await Question.findByIdAndUpdate(
      req.params.id,
      { title, description, expectedAnswer, tags, details, updatedAt: Date.now() },
      { new: true }
    );
    if (!question) return res.status(404).json({ message: 'Question not found' });
    res.json({ message: 'Question updated', question });
  } catch (error) {
    res.status(500).json({ message: 'Error updating question' });
  }
});

// Delete a question
router.delete('/questions/:id', protect, authorize('faculty'), async (req, res) => {
  try {
    const question = await Question.findByIdAndDelete(req.params.id);
    if (!question) return res.status(404).json({ message: 'Question not found' });
    res.json({ message: 'Question deleted' });
  } catch (error) {
    res.status(500).json({ message: 'Error deleting question' });
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

// Export questions (optionally filtered by course)
router.get('/questions/export', protect, authorize('faculty'), async (req, res) => {
  try {
    const { course } = req.query;
    const filter = {};
    if (course) filter.course = course;
    const questions = await Question.find(filter).lean();
    res.setHeader('Content-Disposition', 'attachment; filename=questions_export.json');
    res.setHeader('Content-Type', 'application/json');
    res.status(200).send(JSON.stringify(questions, null, 2));
  } catch (error) {
    res.status(500).json({ message: 'Error exporting questions' });
  }
});

// Export questions as CSV
router.get('/questions/export/csv', protect, authorize('faculty'), async (req, res) => {
  try {
    const { course } = req.query;
    const filter = {};
    if (course) filter.course = course;
    const questions = await Question.find(filter).lean();
    const fields = ['_id', 'course', 'title', 'description', 'expectedAnswer', 'tags', 'details', 'createdAt', 'updatedAt'];
    const parser = new Parser({ fields });
    const csv = parser.parse(questions);
    res.setHeader('Content-Disposition', 'attachment; filename=questions_export.csv');
    res.setHeader('Content-Type', 'text/csv');
    res.status(200).send(csv);
  } catch (error) {
    res.status(500).json({ message: 'Error exporting questions as CSV' });
  }
});

// Export questions as Excel
router.get('/questions/export/excel', protect, authorize('faculty'), async (req, res) => {
  try {
    const { course } = req.query;
    const filter = {};
    if (course) filter.course = course;
    const questions = await Question.find(filter).lean();
    const workbook = new ExcelJS.Workbook();
    const worksheet = workbook.addWorksheet('Questions');
    worksheet.columns = [
      { header: 'ID', key: '_id', width: 24 },
      { header: 'Course', key: 'course', width: 24 },
      { header: 'Title', key: 'title', width: 32 },
      { header: 'Description', key: 'description', width: 40 },
      { header: 'Expected Answer', key: 'expectedAnswer', width: 40 },
      { header: 'Tags', key: 'tags', width: 20 },
      { header: 'Details', key: 'details', width: 40 },
      { header: 'Created At', key: 'createdAt', width: 24 },
      { header: 'Updated At', key: 'updatedAt', width: 24 }
    ];
    questions.forEach(q => {
      worksheet.addRow({
        ...q,
        tags: Array.isArray(q.tags) ? q.tags.join(', ') : '',
        details: typeof q.details === 'object' ? JSON.stringify(q.details) : q.details
      });
    });
    res.setHeader('Content-Disposition', 'attachment; filename=questions_export.xlsx');
    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    await workbook.xlsx.write(res);
    res.end();
  } catch (error) {
    res.status(500).json({ message: 'Error exporting questions as Excel' });
  }
});

// Export questions as PDF
router.get('/questions/export/pdf', protect, authorize('faculty'), async (req, res) => {
  try {
    const { course } = req.query;
    const filter = {};
    if (course) filter.course = course;
    const questions = await Question.find(filter).lean();
    const doc = new PDFDocument({ margin: 30, size: 'A4' });
    res.setHeader('Content-Disposition', 'attachment; filename=questions_export.pdf');
    res.setHeader('Content-Type', 'application/pdf');
    doc.pipe(res);
    doc.fontSize(18).text('Questions Export', { align: 'center' });
    doc.moveDown();
    questions.forEach((q, idx) => {
      doc.fontSize(12).text(`Q${idx + 1}: ${q.title}`);
      if (q.description) doc.text(`Description: ${q.description}`);
      if (q.expectedAnswer) doc.text(`Expected Answer: ${q.expectedAnswer}`);
      if (q.tags && q.tags.length) doc.text(`Tags: ${q.tags.join(', ')}`);
      if (q.details && Object.keys(q.details).length) doc.text(`Details: ${JSON.stringify(q.details)}`);
      doc.text(`Created: ${new Date(q.createdAt).toLocaleString()}`);
      doc.moveDown();
    });
    doc.end();
  } catch (error) {
    res.status(500).json({ message: 'Error exporting questions as PDF' });
  }
});

// Bulk import questions
router.post('/questions/bulk-import', protect, authorize('faculty'), async (req, res) => {
  try {
    const { questions } = req.body;
    if (!Array.isArray(questions) || questions.length === 0) {
      return res.status(400).json({ message: 'No questions provided for import' });
    }
    // Attach createdBy to each question
    const questionsToInsert = questions.map(q => ({ ...q, createdBy: req.user._id }));
    const result = await Question.insertMany(questionsToInsert);
    res.status(201).json({ message: 'Questions imported', count: result.length });
  } catch (error) {
    res.status(500).json({ message: 'Error importing questions' });
  }
});

// Create a new test/exercise
router.post('/tests', protect, authorize('faculty'), async (req, res) => {
  try {
    const { name, course, questions, date, time, metadata, envSettings } = req.body;
    if (!name || !course || !Array.isArray(questions) || questions.length === 0) {
      return res.status(400).json({ message: 'Name, course, and at least one question are required' });
    }
    const test = new Test({
      name,
      course,
      questions,
      date,
      time,
      metadata: metadata || {},
      envSettings: envSettings || {},
      createdBy: req.user._id
    });
    await test.save();
    res.status(201).json({ message: 'Test created', test });
  } catch (error) {
    res.status(500).json({ message: 'Error creating test' });
  }
});

// List all tests for courses assigned to this faculty
router.get('/tests', protect, authorize('faculty'), async (req, res) => {
  try {
    const { course } = req.query;
    // Find all courses assigned to this faculty
    const courseFilter = { facultyId: req.user.id };
    if (course) courseFilter.courseId = course;
    const assignments = await FacultyCourse.find(courseFilter);
    const courseIds = assignments.map(a => a.courseId);
    if (!courseIds.length) return res.json([]);
    // Find all tests for these courses
    const testFilter = { course: { $in: courseIds } };
    const tests = await Test.find(testFilter)
      .populate('course', 'name code')
      .populate('questions');
    res.json(tests);
  } catch (error) {
    res.status(500).json({ message: 'Error fetching tests' });
  }
});

// Get a single test by ID
router.get('/tests/:id', protect, authorize('faculty'), async (req, res) => {
  try {
    const test = await Test.findById(req.params.id).populate('course').populate('questions');
    if (!test) return res.status(404).json({ message: 'Test not found' });
    res.json(test);
  } catch (error) {
    res.status(500).json({ message: 'Error fetching test' });
  }
});

// Update a test
router.put('/tests/:id', protect, authorize('faculty'), async (req, res) => {
  try {
    const { name, questions, date, time, type, batches, metadata, envSettings } = req.body;
    const update = { name, questions, date, time, type, batches, metadata, envSettings, updatedAt: Date.now() };
    // Remove undefined fields
    Object.keys(update).forEach(key => update[key] === undefined && delete update[key]);
    const test = await Test.findByIdAndUpdate(
      req.params.id,
      update,
      { new: true }
    );
    if (!test) return res.status(404).json({ message: 'Test not found' });
    res.json({ message: 'Test updated', test });
  } catch (error) {
    res.status(500).json({ message: 'Error updating test' });
  }
});

// Delete a test
router.delete('/tests/:id', protect, authorize('faculty'), async (req, res) => {
  try {
    const test = await Test.findByIdAndDelete(req.params.id);
    if (!test) return res.status(404).json({ message: 'Test not found' });
    res.json({ message: 'Test deleted' });
  } catch (error) {
    res.status(500).json({ message: 'Error deleting test' });
  }
});

// Add/edit/delete question pool endpoints as needed...

// Add a schedule entry (for test/exercise scheduling)
router.post('/schedule', protect, authorize('faculty'), async (req, res) => {
  try {
    const { course, date, time, type, title, testType, description } = req.body;
    if (!course || !date || !time || !type || !title) {
      return res.status(400).json({ message: 'Missing required fields' });
    }
    const Schedule = require('../models/Schedule');
    const schedule = new Schedule({
      course,
      date,
      time,
      type: testType || type,
      title,
      description,
      faculty: req.user._id
    });
    await schedule.save();
    res.status(201).json({ message: 'Scheduled successfully', schedule });
  } catch (error) {
    res.status(500).json({ message: 'Error scheduling test/exercise' });
  }
});

// Get all batches (and semesters) for a course assigned to this faculty
router.get('/course-batches', protect, authorize('faculty'), async (req, res) => {
  try {
    const { course } = req.query;
  
    if (!course) {
    
      return res.status(400).json({ message: 'Course ID required' });
    }
    const assignments = await FacultyCourse.find({ facultyId: req.user.id, courseId: course });
    let effectiveAssignments = assignments;
    if (assignments.length === 0) {
      const allAssignments = await FacultyCourse.find({ facultyId: req.user.id });
      const filtered = allAssignments.filter(a => String(a.courseId) === String(course));
      effectiveAssignments = filtered;
    }
    // Unique batches and semesters
    const batchSet = new Set();
    const semesterSet = new Set();
    effectiveAssignments.forEach(a => {
      if (a.batch) batchSet.add(a.batch);
      if (a.semester) semesterSet.add(a.semester);
    });
      res.json({
      batches: Array.from(batchSet),
      semesters: Array.from(semesterSet)
    });
  } catch (error) {
    res.status(500).json({ message: 'Error fetching batches' });
  }
});

// DELETE /api/faculty/schedule/:id

router.delete('/schedule/:id', async (req, res) => {
  try {
    const result = await Schedule.findByIdAndDelete(req.params.id);
    if (!result) {
      return res.status(404).json({ message: 'Schedule entry not found' });
    }
    res.json({ message: 'Schedule entry deleted' });
  } catch (err) {
    res.status(500).json({ message: 'Error deleting schedule entry' });
  }
});

module.exports = router;
