const express = require('express');
const router = express.Router();
const ServerLog = require('../models/ServerLog');
const { protect, authorize } = require('../middleware/auth');

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
    
    console.log(`Found logs: ${logs.length}, Total: ${total}`);
    
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

module.exports = router;