const express = require('express');
const router = express.Router();
const { protect, authorize } = require('../middleware/auth');
const Course = require('../models/Course');
const User = require('../models/User');
const FacultyCourse = require('../models/FacultyCourse');

// Get all courses
router.get('/courses', protect, authorize('admin'), async (req, res) => {
  try {
    const courses = await Course.find();
    res.json(courses);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Create a new course
router.post('/courses', protect, authorize('admin'), async (req, res) => {
  try {
    const { name, code } = req.body;

    const newCourse = new Course({ name, code });
    const course = await newCourse.save();
    res.status(201).json({ message: 'Course created successfully', course });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: error.message || 'Server error' });
  }
});

// Update a course
router.put('/courses/:id', protect, authorize('admin'), async (req, res) => {
  try {
    const { name, code } = req.body;

    const course = await Course.findByIdAndUpdate(req.params.id, { name, code }, { new: true });
    if (!course) {
      return res.status(404).json({ message: 'Course not found' });
    }
    res.json({ message: 'Course updated successfully', course });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: error.message || 'Server error' });
  }
});

// Delete a course
router.delete('/courses/:id', protect, authorize('admin'), async (req, res) => {
  try {
    const course = await Course.findByIdAndDelete(req.params.id);
    if (!course) {
      return res.status(404).json({ message: 'Course not found' });
    }
    res.json({ message: 'Course deleted successfully' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Assign faculty to a course for a batch
router.post('/assign-faculty', protect, authorize('admin'), async (req, res) => {
  try {
    const { facultyId, courseId, batch } = req.body;

    const faculty = await User.findById(facultyId);
    if (!faculty || faculty.role !== 'faculty') {
      return res.status(400).json({ message: 'Invalid Faculty ID or Faculty not found.' });
    }

    const course = await Course.findById(courseId);
    if (!course) {
      return res.status(400).json({ message: 'Invalid Course ID or Course not found.' });
    }

    const existingAssignment = await FacultyCourse.findOne({ facultyId, courseId, batch });
    if (existingAssignment) {
      return res.status(400).json({ message: 'Faculty already assigned to this course for this batch.' });
    }

    const newAssignment = new FacultyCourse({ facultyId, courseId, batch });
    await newAssignment.save();

    res.status(201).json({ message: 'Faculty assigned to course successfully', assignment: newAssignment });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: error.message || 'Server error' });
  }
});

// Fetch all assigned courses for a specific faculty
router.get('/assigned-courses/:facultyId', protect, authorize('admin'), async (req, res) => {
  try {
    const { facultyId } = req.params;

    const faculty = await User.findById(facultyId);
    if (!faculty || faculty.role !== 'faculty') {
      return res.status(400).json({ message: 'Invalid Faculty ID or Faculty not found.' });
    }

    const assignedCourses = await FacultyCourse.find({ facultyId })
      .populate('courseId', 'name code')
      .populate('facultyId', 'name user_id');

    res.json(assignedCourses);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: error.message || 'Server error' });
  }
});

// Get users by role
router.get('/users', protect, authorize('admin'), async (req, res) => {
  try {
    const { role } = req.query;
    const users = await User.find({ role: role });
    res.json(users);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router;
