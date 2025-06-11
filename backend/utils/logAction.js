const ServerLog = require('../models/ServerLog');

const logAction = async ({ user_id, action, details }) => {
  try {
    await ServerLog.create({
      user_id,
      action,
      details
    });
  } catch (err) {
    console.error('Failed to log server action:', err);
  }
};

module.exports = logAction;