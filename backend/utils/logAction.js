const ServerLog = require('../models/ServerLog');

const logAction = async ({ user, action, details }) => {
  try {
    await ServerLog.create({
      user,
      action,
      details
    });
  } catch (err) {
    console.error('Failed to log server action:', err);
  }
};

module.exports = logAction;