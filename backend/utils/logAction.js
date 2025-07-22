const ServerLog = require('../models/ServerLog');
const Attendance = require('../models/Attendance');

const logAction = async ({ user_id, action, details, ip, system_id }) => {
  console.log(`Logging action: ${action} for user: ${user_id} with details: ${details}`);
  try {
    await ServerLog.create({
      user_id,
      action,
      details,
      ip,
      system_id
    });
    // Also store attendance records for login/logout actions
    if (action === 'login' || action === 'logout') {
      await Attendance.create({
        user_id,
        action,
        details,
        ip,
        system_id
      });
    }
  } catch (err) {
    console.error('Failed to log server action:', err);
  }
};

module.exports = logAction;