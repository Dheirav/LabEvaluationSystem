const express = require('express');
const router = express.Router();
const { protect, authorize } = require('../middleware/auth');
const Course = require('../models/Course');
const User = require('../models/User');
const FacultyCourse = require('../models/FacultyCourse');
const logAction = require('../utils/logAction');

// Helper to safely log actions with details
async function safeLogAction(user, action, details) {
  if (typeof action === 'string' && action.trim()) {
    try {
      await logAction({ user_id: user.user_id, action, details });
    } catch (err) {
      console.warn('Failed to log server action:', err);
    }
  } else {
    console.warn('logAction called with empty or invalid action:', action);
  }
}

// Helper to update assignedCourses for students in a batch/semester
async function updateStudentAssignedCourses(courseId, batch, semester) {
  // Find all students in the batch and semester
  const students = await User.find({ role: 'student', batch, semester: Number(semester) });
  for (const student of students) {
    // Add courseId if not present
    if (!student.assignedCourses.some(cid => cid.toString() === courseId.toString())) {
      student.assignedCourses.push(courseId);
      await student.save();
    }
  }
}

// Helper to remove course from students in a batch/semester
async function removeStudentAssignedCourse(courseId, batch, semester) {
  const students = await User.find({ role: 'student', batch, semester: Number(semester) });
  for (const student of students) {
    const before = student.assignedCourses.length;
    student.assignedCourses = student.assignedCourses.filter(cid => cid.toString() !== courseId.toString());
    if (student.assignedCourses.length !== before) {
      await student.save();
    }
  }
}

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
    const { name, code, semester } = req.body;
    const newCourse = new Course({ name, code, semester });
    const course = await newCourse.save();
    await safeLogAction(req.user, 'create_course', `Created course: ${name} (${code}), Semester: ${semester}`);
    res.status(201).json({ message: 'Course created successfully', course });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: error.message || 'Server error' });
  }
});

// Update a course
router.put('/courses/:id', protect, authorize('admin'), async (req, res) => {
  try {
    const { name, code, semester } = req.body;
    const course = await Course.findByIdAndUpdate(req.params.id, { name, code, semester }, { new: true });
    if (!course) {
      return res.status(404).json({ message: 'Course not found' });
    }
    await safeLogAction(req.user, 'update_course', `Updated course: ${name} (${code}), Semester: ${semester}`);
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
    await safeLogAction(req.user, 'delete_course', `Deleted course: ${course.name} (${course.code})`);
    res.json({ message: 'Course deleted successfully' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Assign faculty to a course for a batch
router.post('/assign-faculty', protect, authorize('admin'), async (req, res) => {
  try {
    const { facultyId, courseId, batch, semester } = req.body;
    const faculty = await User.findById(facultyId);
    if (!faculty || faculty.role !== 'faculty') {
      return res.status(400).json({ message: 'Invalid Faculty ID or Faculty not found.' });
    }
    const course = await Course.findById(courseId);
    if (!course) {
      return res.status(400).json({ message: 'Invalid Course ID or Course not found.' });
    }
    const existingAssignment = await FacultyCourse.findOne({ facultyId, courseId, batch, semester });
    if (existingAssignment) {
      return res.status(400).json({ message: 'Faculty already assigned to this course for this batch and semester.' });
    }
    const newAssignment = new FacultyCourse({ facultyId, courseId, batch, semester });
    await newAssignment.save();
    await updateStudentAssignedCourses(courseId, batch, semester);
    await safeLogAction(req.user, 'assign_faculty', `Assigned faculty ${faculty.name} (${faculty.user_id}) to course ${course.name} (${course.code}) for batch ${batch}, semester ${semester}`);
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

// Get live user stats
router.get('/user-stats', protect, authorize('admin'), async (req, res) => {
  try {
    // Total by role
    const students = await User.countDocuments({ role: 'student' });
    const faculty = await User.countDocuments({ role: 'faculty' });
    const admins = await User.countDocuments({ role: 'admin' });

    // Active by role (session_token not null)
    const activeStudents = await User.countDocuments({ role: 'student', session_token: { $ne: null } });
    const activeFaculty = await User.countDocuments({ role: 'faculty', session_token: { $ne: null } });
    const activeAdmins = await User.countDocuments({ role: 'admin', session_token: { $ne: null } });
    res.json({
      students,
      faculty,
      admins,
      activeStudents,
      activeFaculty,
      activeAdmins
    });
  } catch (err) {
    res.status(500).json({ message: 'Error fetching stats' });
  }
});

// Get all faculty with their assigned courses and batches
router.get('/faculty-assignments', protect, authorize('admin'), async (req, res) => {
  try {
    const faculties = await User.find({ role: 'faculty' });
    const FacultyCourse = require('../models/FacultyCourse');
    const facultiesWithAssignments = await Promise.all(faculties.map(async (faculty) => {
      const assignments = await FacultyCourse.find({ facultyId: faculty._id })
        .populate('courseId');
      return {
        ...faculty.toObject(),
        assignedCourses: assignments
      };
    }));
    res.json(facultiesWithAssignments);
  } catch (err) {
    console.error('Error fetching faculty assignments:', err);
    res.status(500).json({ message: 'Error fetching faculty assignments' });
  }
});

// Update a faculty course assignment
router.put('/faculty-course/:assignmentId', protect, authorize('admin'), async (req, res) => {
  try {
    const { assignmentId } = req.params;
    const { courseId, batch, semester } = req.body;
    const assignment = await FacultyCourse.findById(assignmentId);
    if (!assignment) {
      return res.status(404).json({ message: 'Assignment not found' });
    }
    assignment.courseId = courseId;
    assignment.batch = batch;
    if (semester !== undefined) assignment.semester = semester;
    await assignment.save();
    await updateStudentAssignedCourses(courseId, batch, semester);
    await safeLogAction(req.user, 'update_faculty_assignment', `Updated faculty course assignment: ${assignmentId} to course ${courseId}, batch ${batch}, semester ${semester}`);
    res.json({ message: 'Assignment updated successfully', assignment });
  } catch (error) {
    console.error('Error updating assignment:', error);
    res.status(500).json({ message: 'Error updating assignment' });
  }
});

// Delete a faculty course assignment
router.delete('/faculty-course/:assignmentId', protect, authorize('admin'), async (req, res) => {
  try {
    const { assignmentId } = req.params;
    const assignment = await FacultyCourse.findByIdAndDelete(assignmentId);
    if (!assignment) {
      return res.status(404).json({ message: 'Assignment not found' });
    }
    await removeStudentAssignedCourse(assignment.courseId, assignment.batch, assignment.semester);
    await safeLogAction(req.user, 'delete_faculty_assignment', `Deleted faculty course assignment: ${assignmentId}`);
    res.json({ message: 'Assignment deleted successfully' });
  } catch (error) {
    console.error('Error deleting assignment:', error);
    res.status(500).json({ message: 'Error deleting assignment' });
  }
});

// Admin: Clear a user's session token
router.post('/clear-session/:userId', protect, authorize('admin'), async (req, res) => {
  try {
    const { userId } = req.params;
    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }
    user.session_token = null;
    await user.save();
    await safeLogAction(req.user, 'clear_user_session', `Cleared session for user: ${user.user_id}`);
    res.json({ message: 'Session token cleared for user.' });
  } catch (error) {
    console.error('Error clearing user session:', error);
    res.status(500).json({ message: 'Error clearing user session' });
  }
});

module.exports = router;


