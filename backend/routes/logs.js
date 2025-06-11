const express = require('express');
const { Parser } = require('json2csv');
const ExcelJS = require('exceljs'); 
const PDFDocument = require('pdfkit'); 
const router = express.Router();
const ServerLog = require('../models/ServerLog');
const { protect, authorize } = require('../middleware/auth');
const logAction = require('../utils/logAction');

// DELETE /api/logs/delete_logs
router.delete('/delete_logs', protect, authorize('admin'), async (req, res) => {
  try {
    const { user, action, from, to, details } = req.query;
    const filter = {};

    // Build filter object based on query parameters
    if (user) filter.user = { $regex: user, $options: 'i' };
    if (action) filter.action = { $regex: action, $options: 'i' };
    if (details) filter.details = { $regex: details, $options: 'i' };
    if (from || to) {
      filter.timestamp = {};
      if (from) filter.timestamp.$gte = new Date(from);
      if (to) filter.timestamp.$lte = new Date(to);
    }

    console.log('Deleting logs with filter:', filter);
    
    // Get count of matching documents (for logging)
    const count = await ServerLog.countDocuments(filter);
    
    // Execute the delete operation
    const result = await ServerLog.deleteMany(filter);
    
    // Log this action
    await logAction({
      user_id: req.user.user_id,
      action: 'delete_logs',
      details: `User ${req.user.user_id} deleted ${result.deletedCount} logs with filters: ${JSON.stringify(filter)}`
    });
    
    res.json({ 
      message: `Successfully deleted ${result.deletedCount} logs`,
      deletedCount: result.deletedCount
    });
  } catch (err) {
    console.error('Error deleting logs:', err);
    res.status(500).json({ message: 'Failed to delete logs' });
  }
});

router.get('/get_logs', protect, authorize('admin'), async (req, res) => {
  try {
    const { user, action, from, to, details, page = 0, rowsPerPage = 10 } = req.query;
    const filter = {};

    if (user) filter.user = { $regex: user, $options: 'i' };
    if (action) filter.action = { $regex: action, $options: 'i' };
    if (details) filter.details = { $regex: details, $options: 'i' };
    if (from || to) {
      filter.timestamp = {};
      if (from) filter.timestamp.$gte = new Date(from);
      if (to) filter.timestamp.$lte = new Date(to);
    }

    // Count total documents for pagination
    const total = await ServerLog.countDocuments(filter);
    
    // Get paginated results
    const logs = await ServerLog.find(filter)
      .sort({ timestamp: -1 })
      .skip(page * rowsPerPage)
      .limit(Number(rowsPerPage));
    
    // Return both the logs and pagination metadata
    res.json({
      logs,
      pagination: {
        total,
        page: Number(page),
        rowsPerPage: Number(rowsPerPage)
      }
    });
  } catch (err) {
    console.error('Error fetching logs:', err);
    res.json({ logs: [], pagination: { total: 0, page: 0, rowsPerPage: 10 } });
  }
});

// CSV
router.get('/download/csv', protect, authorize('admin'), async (req, res) => {
  const logs = await ServerLog.find().lean();
  const fields = ['timestamp', 'user', 'action', 'details'];
  const parser = new Parser({ fields });
  const csv = parser.parse(logs);
  res.header('Content-Type', 'text/csv');
  res.attachment('server_logs.csv');
  res.send(csv);
});

// JSON
router.get('/download/json', protect, authorize('admin'), async (req, res) => {
  const logs = await ServerLog.find().lean();
  res.header('Content-Type', 'application/json');
  res.attachment('server_logs.json');
  res.send(JSON.stringify(logs, null, 2));
});

// Excel
router.get('/download/excel', protect, authorize('admin'), async (req, res) => {
  const logs = await ServerLog.find().lean();
  const workbook = new ExcelJS.Workbook();
  const worksheet = workbook.addWorksheet('Logs');
  worksheet.columns = [
    { header: 'Timestamp', key: 'timestamp', width: 25 },
    { header: 'User', key: 'user', width: 20 },
    { header: 'Action', key: 'action', width: 20 },
    { header: 'Details', key: 'details', width: 40 },
  ];
  logs.forEach(log => worksheet.addRow(log));
  res.header('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
  res.attachment('server_logs.xlsx');
  await workbook.xlsx.write(res);
  res.end();
});

// PDF
router.get('/download/pdf', protect, authorize('admin'), async (_req, res) => {
  const logs = await ServerLog.find().lean();
  const doc = new PDFDocument({ margin: 30, size: 'A4', layout: 'landscape' });
  res.header('Content-Type', 'application/pdf');
  res.attachment('server_logs.pdf');
  doc.pipe(res);

  // Table setup
  const tableTop = 60;
  const colWidths = [150, 120, 120, 350];
  const startX = doc.page.margins.left;
  let y = tableTop;

  // Draw title
  doc.fontSize(18).text('Server Logs', { align: 'center' });
  y += 10;

  // Draw header background
  doc.rect(startX, y, colWidths.reduce((a, b) => a + b), 24).fill('#f5f5f5').stroke();
  doc.fillColor('#222').fontSize(12);

  // Draw headers
  let x = startX;
  ['Timestamp', 'User', 'Action', 'Details'].forEach((header, i) => {
    doc.text(header, x + 5, y + 6, { width: colWidths[i] - 10, align: 'left' });
    x += colWidths[i];
  });

  // Draw header border
  doc.moveTo(startX, y).lineTo(startX + colWidths.reduce((a, b) => a + b), y).stroke();
  y += 24;

  // Draw rows with dynamic height
  logs.forEach((log, idx) => {
    x = startX;
    const cellData = [
      new Date(log.timestamp).toLocaleString(),
      log.user,
      log.action,
      log.details
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
});

module.exports = router;