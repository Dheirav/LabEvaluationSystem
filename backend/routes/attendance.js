const express = require('express');
const router = express.Router();
const ServerLog = require('../models/ServerLog');
const User = require('../models/User');

// Get attendance for a user (all sessions with login/logout and duration)
router.get('/user/:user_id', async (req, res) => {
  try {
    const { user_id } = req.params;
    // Find all login/logout logs for this user, sorted by time
    const logs = await ServerLog.find({ user_id, action: { $in: ['login', 'logout'] } }).sort({ timestamp: 1 });
    const sessions = [];
    let currentSession = null;
    logs.forEach(log => {
      if (log.action === 'login') {
        if (currentSession) sessions.push(currentSession); // push incomplete session
        currentSession = { login: log.timestamp, loginDetails: log.details, logout: null, logoutDetails: null };
      } else if (log.action === 'logout' && currentSession) {
        currentSession.logout = log.timestamp;
        currentSession.logoutDetails = log.details;
        sessions.push(currentSession);
        currentSession = null;
      }
    });
    // If last session is open, push it
    if (currentSession) sessions.push(currentSession);
    // Add duration
    sessions.forEach(s => {
      if (s.login && s.logout) {
        s.durationMinutes = Math.round((new Date(s.logout) - new Date(s.login)) / 60000);
      } else {
        s.durationMinutes = null;
      }
    });
    res.json(sessions);
  } catch (err) {
    res.status(500).json({ message: 'Failed to fetch attendance' });
  }
});


// Get attendance for all students in a batch/semester/course (faculty/admin)
// Query params: course_id, batch, semester (all optional, but at least one required)
router.get('/students', async (req, res) => {
  try {
    const { course_id, batch, semester } = req.query;
    if (!course_id && !batch && !semester) {
      return res.status(400).json({ message: 'At least one filter (course_id, batch, semester) is required' });
    }
    // Find students matching the filters
    const userQuery = { role: 'student' };
    if (batch) userQuery.batch = batch;
    if (semester) userQuery.semester = semester;
    if (course_id) userQuery.assignedCourses = course_id;
    const students = await User.find(userQuery).select('-password');
    // For each student, get their attendance sessions
    const attendancePromises = students.map(async student => {
      const logs = await ServerLog.find({ user_id: student._id, action: { $in: ['login', 'logout'] } }).sort({ timestamp: 1 });
      const sessions = [];
      let currentSession = null;
      logs.forEach(log => {
        if (log.action === 'login') {
          if (currentSession) sessions.push(currentSession);
          currentSession = { login: log.timestamp, loginDetails: log.details, logout: null, logoutDetails: null };
        } else if (log.action === 'logout' && currentSession) {
          currentSession.logout = log.timestamp;
          currentSession.logoutDetails = log.details;
          sessions.push(currentSession);
          currentSession = null;
        }
      });
      if (currentSession) sessions.push(currentSession);
      sessions.forEach(s => {
        if (s.login && s.logout) {
          s.durationMinutes = Math.round((new Date(s.logout) - new Date(s.login)) / 60000);
        } else {
          s.durationMinutes = null;
        }
      });
      return {
        student: {
          _id: student._id,
          name: student.name,
          email: student.email,
          batch: student.batch,
          semester: student.semester,
          rollNumber: student.rollNumber,
        },
        sessions
      };
    });
    const attendance = await Promise.all(attendancePromises);
    res.json(attendance);
  } catch (err) {
    res.status(500).json({ message: 'Failed to fetch students attendance', error: err.message });
  }
});

// (Optional) Export attendance as CSV for all students (faculty/admin)
router.get('/students/export', async (req, res) => {
  try {
    const { course_id, batch, semester } = req.query;
    if (!course_id && !batch && !semester) {
      return res.status(400).json({ message: 'At least one filter (course_id, batch, semester) is required' });
    }
    const userQuery = { role: 'student' };
    if (batch) userQuery.batch = batch;
    if (semester) userQuery.semester = semester;
    if (course_id) userQuery.assignedCourses = course_id;
    const students = await User.find(userQuery).select('-password');
    const attendancePromises = students.map(async student => {
      const logs = await ServerLog.find({ user_id: student._id, action: { $in: ['login', 'logout'] } }).sort({ timestamp: 1 });
      const sessions = [];
      let currentSession = null;
      logs.forEach(log => {
        if (log.action === 'login') {
          if (currentSession) sessions.push(currentSession);
          currentSession = { login: log.timestamp, logout: null };
        } else if (log.action === 'logout' && currentSession) {
          currentSession.logout = log.timestamp;
          sessions.push(currentSession);
          currentSession = null;
        }
      });
      if (currentSession) sessions.push(currentSession);
      sessions.forEach(s => {
        if (s.login && s.logout) {
          s.durationMinutes = Math.round((new Date(s.logout) - new Date(s.login)) / 60000);
        } else {
          s.durationMinutes = null;
        }
      });
      return { student, sessions };
    });
    const attendance = await Promise.all(attendancePromises);
    // Build CSV
    let csv = 'Name,Email,Roll Number,Batch,Semester,Login,Logout,Duration (minutes)\n';
    attendance.forEach(({ student, sessions }) => {
      sessions.forEach(s => {
        csv += `"${student.name}","${student.email}","${student.rollNumber}","${student.batch}","${student.semester}","${s.login ? new Date(s.login).toISOString() : ''}","${s.logout ? new Date(s.logout).toISOString() : ''}","${s.durationMinutes !== null ? s.durationMinutes : ''}"\n`;
      });
    });
    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', 'attachment; filename="attendance_report.csv"');
    res.send(csv);
  } catch (err) {
    res.status(500).json({ message: 'Failed to export attendance', error: err.message });
  }
});


// Get attendance for all students (with optional filters for course, batch, semester)
router.get('/students', async (req, res) => {
  try {
    // Optional filters: course, batch, semester
    const { course, batch, semester } = req.query;
    // Find all students
    let studentQuery = { role: 'student' };
    if (batch) studentQuery.batch = batch;
    if (semester) studentQuery.semester = semester;
    if (course) studentQuery.assignedCourses = course;
    const students = await User.find(studentQuery);
    // For each student, get their attendance sessions
    const attendance = await Promise.all(students.map(async (student) => {
      const logs = await ServerLog.find({ user_id: student._id, action: { $in: ['login', 'logout'] } }).sort({ timestamp: 1 });
      let sessions = [];
      let currentSession = null;
      logs.forEach(log => {
        if (log.action === 'login') {
          if (currentSession) sessions.push(currentSession);
          currentSession = { login: log.timestamp, loginDetails: log.details, logout: null, logoutDetails: null };
        } else if (log.action === 'logout' && currentSession) {
          currentSession.logout = log.timestamp;
          currentSession.logoutDetails = log.details;
          sessions.push(currentSession);
          currentSession = null;
        }
      });
      if (currentSession) sessions.push(currentSession);
      sessions.forEach(s => {
        if (s.login && s.logout) {
          s.durationMinutes = Math.round((new Date(s.logout) - new Date(s.login)) / 60000);
        } else {
          s.durationMinutes = null;
        }
      });
      return {
        student_id: student._id,
        name: student.name,
        email: student.email,
        batch: student.batch,
        semester: student.semester,
        assignedCourses: student.assignedCourses,
        sessions
      };
    }));
    res.json(attendance);
  } catch (err) {
    res.status(500).json({ message: 'Failed to fetch students attendance' });
  }
});

// Export attendance for all students as CSV (with optional filters)
router.get('/students/export', async (req, res) => {
  try {
    const { course, batch, semester } = req.query;
    let studentQuery = { role: 'student' };
    if (batch) studentQuery.batch = batch;
    if (semester) studentQuery.semester = semester;
    if (course) studentQuery.assignedCourses = course;
    const students = await User.find(studentQuery);
    let rows = [];
    for (const student of students) {
      const logs = await ServerLog.find({ user_id: student._id, action: { $in: ['login', 'logout'] } }).sort({ timestamp: 1 });
      let sessions = [];
      let currentSession = null;
      logs.forEach(log => {
        if (log.action === 'login') {
          if (currentSession) sessions.push(currentSession);
          currentSession = { login: log.timestamp, loginDetails: log.details, logout: null, logoutDetails: null };
        } else if (log.action === 'logout' && currentSession) {
          currentSession.logout = log.timestamp;
          currentSession.logoutDetails = log.details;
          sessions.push(currentSession);
          currentSession = null;
        }
      });
      if (currentSession) sessions.push(currentSession);
      sessions.forEach(s => {
        let duration = (s.login && s.logout) ? Math.round((new Date(s.logout) - new Date(s.login)) / 60000) : '';
        rows.push({
          student_id: student._id,
          name: student.name,
          email: student.email,
          batch: student.batch,
          semester: student.semester,
          assignedCourses: student.assignedCourses ? student.assignedCourses.join(';') : '',
          login: s.login ? new Date(s.login).toISOString() : '',
          logout: s.logout ? new Date(s.logout).toISOString() : '',
          durationMinutes: duration
        });
      });
    }
    // CSV header
    let csv = 'student_id,name,email,batch,semester,assignedCourses,login,logout,durationMinutes\n';
    rows.forEach(row => {
      csv += `${row.student_id},${row.name},${row.email},${row.batch},${row.semester},"${row.assignedCourses}",${row.login},${row.logout},${row.durationMinutes}\n`;
    });
    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', 'attachment; filename="attendance_report.csv"');
    res.send(csv);
  } catch (err) {
    res.status(500).json({ message: 'Failed to export students attendance' });
  }
});

module.exports = router;
