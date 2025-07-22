const express = require('express');
const router = express.Router();
const Attendance = require('../models/Attendance');
const User = require('../models/User');
const { Parser } = require('json2csv');
const ExcelJS = require('exceljs');
const PDFDocument = require('pdfkit');

// Log attendance (login/logout)
router.post('/log', async (req, res) => {
  try {
    let { user_id, action, details, ip, system_id } = req.body;
    if (!user_id || !action || !['login', 'logout'].includes(action)) {
      return res.status(400).json({ message: 'user_id and valid action required' });
    }
    // If user_id is not a valid ObjectId, try to look up the user
    if (typeof user_id === 'string' && !user_id.match(/^[a-fA-F0-9]{24}$/)) {
      // Try to find user by rollNumber, username, or email
      const user = await User.findOne({ $or: [
        { rollNumber: user_id },
        { username: user_id },
        { email: user_id }
      ] });
      if (!user) {
        return res.status(400).json({ message: 'User not found for user_id: ' + user_id });
      }
      user_id = user._id;
    }
    let attendanceData = { user_id, action, details, ip, system_id };
    if (action === 'logout') {
      // Find the latest login event for this user
      const lastLogin = await Attendance.findOne({ user_id, action: 'login' }).sort({ timestamp: -1 });
      if (lastLogin) {
        const duration = Math.round((Date.now() - new Date(lastLogin.timestamp)) / 60000);
        attendanceData.durationMinutes = duration;
      }
    }
    const attendance = new Attendance(attendanceData);
    await attendance.save();
    res.status(201).json({ message: 'Attendance logged', attendance });
  } catch (err) {
    res.status(500).json({ message: 'Failed to log attendance', error: err.message });
  }
});

// Get attendance sessions for a user (with duration)
router.get('/user/:user_id', async (req, res) => {
  try {
    const { user_id } = req.params;
    const logs = await Attendance.find({ user_id, action: { $in: ['login', 'logout'] } }).sort({ timestamp: 1 });
    let sessions = [];
    let currentSession = null;
    for (const log of logs) {
      if (log.action === 'login') {
        if (currentSession) sessions.push(currentSession);
        currentSession = {
          login: log.timestamp,
          loginDetails: log.details,
          logout: null,
          logoutDetails: null,
          ip: log.ip,
          system_id: log.system_id
        };
      } else if (log.action === 'logout' && currentSession) {
        currentSession.logout = log.timestamp;
        currentSession.logoutDetails = log.details;
        currentSession.logout_ip = log.ip;
        currentSession.logout_system_id = log.system_id;
        sessions.push(currentSession);
        currentSession = null;
      }
    }
    if (currentSession) sessions.push(currentSession);
    sessions = sessions.map(s => {
      let duration = null;
      if (s.login && s.logout) {
        const ms = new Date(s.logout) - new Date(s.login);
        const totalSeconds = Math.floor(ms / 1000);
        const hours = Math.floor(totalSeconds / 3600);
        const minutes = Math.floor((totalSeconds % 3600) / 60);
        const seconds = totalSeconds % 60;
        duration = {
          hours,
          minutes,
          seconds,
          formatted: `${hours}h ${minutes}m ${seconds}s`
        };
      }
      return {
        ...s,
        duration
      };
    });
    res.json({ user_id, sessions });
  } catch (err) {
    res.status(500).json({ message: 'Failed to fetch attendance', error: err.message });
  }
});

// Get attendance for all students (for faculty dashboard)
router.get('/students', async (req, res) => {
  try {
    const { batch, semester, course } = req.query;
    let studentQuery = { role: 'student' };
    if (batch) studentQuery.batch = batch;
    if (semester) studentQuery.semester = semester;
    if (course) studentQuery.assignedCourses = course;
    const students = await User.find(studentQuery).select('-password');
    const attendance = await Promise.all(students.map(async (student) => {
      const logs = await Attendance.find({ user_id: String(student._id), action: { $in: ['login', 'logout'] } }).sort({ timestamp: 1 });
      let sessions = [];
      let currentSession = null;
      logs.forEach(log => {
        if (log.action === 'login') {
          if (currentSession) sessions.push(currentSession);
          currentSession = {
            login: log.timestamp,
            loginDetails: log.details,
            logout: null,
            logoutDetails: null,
            ip: log.ip,
            system_id: log.system_id
          };
        } else if (log.action === 'logout' && currentSession) {
          currentSession.logout = log.timestamp;
          currentSession.logoutDetails = log.details;
          currentSession.logout_ip = log.ip;
          currentSession.logout_system_id = log.system_id;
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
        rollNumber: student.rollNumber,
        assignedCourses: student.assignedCourses,
        sessions
      };
    }));
    res.json(attendance);
  } catch (err) {
    res.status(500).json({ message: 'Failed to fetch students attendance', error: err.message });
  }
});



// Helper to get attendance rows
async function getAttendanceRows(query) {
  const { batch, semester, course } = query;
  let studentQuery = { role: 'student' };
  if (batch) studentQuery.batch = batch;
  if (semester) studentQuery.semester = semester;
  if (course) studentQuery.assignedCourses = course;
  const students = await User.find(studentQuery).select('-password');
  let rows = [];
  for (const student of students) {
    const logs = await Attendance.find({ user_id: String(student._id), action: { $in: ['login', 'logout'] } }).sort({ timestamp: 1 });
    let sessions = [];
    let currentSession = null;
    logs.forEach(log => {
      if (log.action === 'login') {
        if (currentSession) sessions.push(currentSession);
        currentSession = {
          login: log.timestamp,
          logout: null
        };
      } else if (log.action === 'logout' && currentSession) {
        currentSession.logout = log.timestamp;
        sessions.push(currentSession);
        currentSession = null;
      }
    });
    if (currentSession) sessions.push(currentSession);
    sessions.forEach(s => {
      let duration = '';
      if (s.login && s.logout) {
        duration = Math.round((new Date(s.logout) - new Date(s.login)) / 60000);
      }
      rows.push({
        Name: student.name,
        Batch: student.batch,
        Semester: student.semester,
        'Session Login': s.login ? new Date(s.login).toLocaleString() : '',
        'Session Logout': s.logout ? new Date(s.logout).toLocaleString() : '',
        'Duration (min)': duration
      });
    });
  }
  return rows;
}

// CSV
router.get('/students/export/csv', async (req, res) => {
  try {
    const rows = await getAttendanceRows(req.query);
    const header = ['Name', 'Batch', 'Semester', 'Session Login', 'Session Logout', 'Duration (min)'];
    const csv = [header.join(',')].concat(
      rows.map(row => header.map(h => `"${String(row[h] || '').replace(/"/g, '""')}"`).join(','))
    ).join('\n');
    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', 'attachment; filename="attendance_report.csv"');
    res.send(csv);
  } catch (err) {
    res.status(500).json({ message: 'Failed to export attendance', error: err.message });
  }
});

// JSON
router.get('/students/export/json', async (req, res) => {
  try {
    const rows = await getAttendanceRows(req.query);
    res.setHeader('Content-Type', 'application/json');
    res.setHeader('Content-Disposition', 'attachment; filename="attendance_report.json"');
    res.send(JSON.stringify(rows, null, 2));
  } catch (err) {
    res.status(500).json({ message: 'Failed to export attendance', error: err.message });
  }
});

// Excel
router.get('/students/export/excel', async (req, res) => {
  try {
    const rows = await getAttendanceRows(req.query);
    const ExcelJS = require('exceljs');
    const workbook = new ExcelJS.Workbook();
    const worksheet = workbook.addWorksheet('Attendance');
    worksheet.columns = [
      { header: 'Name', key: 'Name', width: 20 },
      { header: 'Batch', key: 'Batch', width: 10 },
      { header: 'Semester', key: 'Semester', width: 10 },
      { header: 'Session Login', key: 'Session Login', width: 25 },
      { header: 'Session Logout', key: 'Session Logout', width: 25 },
      { header: 'Duration (min)', key: 'Duration (min)', width: 15 },
    ];
    rows.forEach(row => worksheet.addRow(row));
    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    res.setHeader('Content-Disposition', 'attachment; filename="attendance_report.xlsx"');
    await workbook.xlsx.write(res);
    res.end();
  } catch (err) {
    res.status(500).json({ message: 'Failed to export attendance', error: err.message });
  }
});

// PDF
router.get('/students/export/pdf', async (req, res) => {
  try {
    const rows = await getAttendanceRows(req.query);
    const PDFDocument = require('pdfkit');
    const doc = new PDFDocument({ margin: 30, size: 'A4', layout: 'landscape' });
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', 'attachment; filename="attendance_report.pdf"');
    doc.pipe(res);
    // Table setup
    const tableTop = 60;
    const colWidths = [120, 60, 60, 140, 140, 80];
    const startX = doc.page.margins.left;
    let y = tableTop;
    // Draw title
    doc.fontSize(18).text('Attendance Report', { align: 'center' });
    y += 10;
    // Draw header background
    doc.rect(startX, y, colWidths.reduce((a, b) => a + b), 24).fill('#f5f5f5').stroke();
    doc.fillColor('#222').fontSize(12);
    // Draw headers
    let x = startX;
    ['Name', 'Batch', 'Semester', 'Session Login', 'Session Logout', 'Duration (min)'].forEach((header, i) => {
      doc.text(header, x + 5, y + 6, { width: colWidths[i] - 10, align: 'left' });
      x += colWidths[i];
    });
    // Draw header border
    doc.moveTo(startX, y).lineTo(startX + colWidths.reduce((a, b) => a + b), y).stroke();
    y += 24;
    // Draw rows with dynamic height
    rows.forEach((row, idx) => {
      x = startX;
      const cellData = [
        row['Name'],
        row['Batch'],
        row['Semester'],
        row['Session Login'],
        row['Session Logout'],
        row['Duration (min)']
      ];
      // Calculate required height for each cell
      const cellHeights = cellData.map((text, i) =>
        doc.heightOfString(text || '', {
          width: colWidths[i] - 10,
          align: 'left'
        })
      );
      const rowHeight = Math.max(...cellHeights) + 12; // Add padding
      // Alternate row color
      if (idx % 2 === 0) {
        doc.rect(x, y, colWidths.reduce((a, b) => a + b), rowHeight).fill('#fafafa').stroke();
        doc.fillColor('#222');
      } else {
        doc.fillColor('#222');
      }
      // Draw cells
      x = startX;
      cellData.forEach((text, i) => {
        doc.text(text || '', x + 5, y + 6, {
          width: colWidths[i] - 10,
          align: 'left'
        });
        // Draw cell border
        doc.rect(x, y, colWidths[i], rowHeight).stroke();
        x += colWidths[i];
      });
      y += rowHeight;
      // Add new page if needed
      if (y + rowHeight > doc.page.height - doc.page.margins.bottom) {
        doc.addPage();
        y = tableTop;
      }
    });
    doc.end();
  } catch (err) {
    res.status(500).json({ message: 'Failed to export attendance', error: err.message });
  }
});

// Clear all attendance logs for students
router.delete('/students/logs', async (req, res) => {
  try {
    // Only delete logs for users with role student
    const students = await User.find({ role: 'student' }).select('_id');
    const studentIds = students.map(s => s._id);
    await Attendance.deleteMany({ user_id: { $in: studentIds } });
    res.json({ message: 'All student attendance logs cleared.' });
  } catch (err) {
    res.status(500).json({ message: 'Failed to clear logs', error: err.message });
  }
});

module.exports = router;
