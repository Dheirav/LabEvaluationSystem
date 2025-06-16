const express = require('express');
const router = express.Router();
const { protect, authorize } = require('../middleware/auth');
const Course = require('../models/Course');
const User = require('../models/User');

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
    const { name, code, faculty: facultyUserId } = req.body;

    const facultyUser = await User.findOne({ user_id: facultyUserId, role: 'faculty' });
    if (!facultyUser) {
      return res.status(400).json({ message: 'Invalid Faculty ID or Faculty not found.' });
    }

    const newCourse = new Course({ name, code, faculty: facultyUser._id });
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
    const { name, code, faculty: facultyUserId } = req.body;

    const facultyUser = await User.findOne({ user_id: facultyUserId, role: 'faculty' });
    if (!facultyUser) {
      return res.status(400).json({ message: 'Invalid Faculty ID or Faculty not found.' });
    }

    const course = await Course.findByIdAndUpdate(req.params.id, { name, code, faculty: facultyUser._id }, { new: true });
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

module.exports = router;
