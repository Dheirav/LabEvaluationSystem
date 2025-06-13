const express = require('express');
const jwt = require('jsonwebtoken');
const xlsx = require('xlsx');
const pdfParse = require('pdf-parse')
const bcrypt = require('bcryptjs');
const User = require('../models/User');
const logAction = require('../utils/logAction');
const { protect,authorize } = require('../middleware/auth');
const multerUpload = require('../middleware/upload');
const { v4: uuidv4 } = require('uuid'); 

const Batch = require('../models/Batch');

const router = express.Router();

const generateToken = (user) => {
    return jwt.sign(
        { id: user._id, role: user.role },
        process.env.JWT_SECRET,
        { expiresIn: '7d' }
    );
}

// ...existing registration and bulk registration routes...

router.post('/login', async (req, res) => {
    const { user_id, password } = req.body;

    const user = await User.findOne({ user_id });
    if (!user) {
        await logAction({
            user_id: user_id,
            action: 'login_attempt',
            details: 'Failed login: invalid user_id',
            ip: req.headers['x-forwarded-for']?.split(',').shift() ||
                req.socket?.remoteAddress ||
                req.connection?.remoteAddress ||
                '',
            system_id: req.body.system_id || req.headers['user-agent'] || 'unknown'
        });
        return res.status(401).json({ message: 'Invalid user_id' });
    }
    const isMatch = await user.comparePassword(password);
    if (!isMatch) {
        await logAction({
            user_id: user_id,
            action: 'login_attempt',
            details: 'Failed login: invalid password',
            ip: req.headers['x-forwarded-for']?.split(',').shift() ||
                req.socket?.remoteAddress ||
                req.connection?.remoteAddress ||
                '',
            system_id: req.body.system_id || req.headers['user-agent'] || 'unknown'
        });
        return res.status(401).json({ message: 'Invalid password' });
    }

    // Only block concurrent login for students
    if (user.role === 'student' && user.session_token) {
        await logAction({
            user_id: user_id,
            action: 'login_attempt',
            details: 'ALERT: student already logged in elsewhere',
            ip: req.headers['x-forwarded-for']?.split(',').shift() ||
                req.socket?.remoteAddress ||
                req.connection?.remoteAddress ||
                '',
            system_id: req.body.system_id || req.headers['user-agent'] || 'unknown'
        });
        return res.status(401).json({ message: 'Student is already logged in elsewhere. Please logout first.' });
    }

    // Get IP address
    const ip =
        req.headers['x-forwarded-for']?.split(',').shift() ||
        req.socket?.remoteAddress ||
        req.connection?.remoteAddress ||
        '';

    // Get system info from request
    const system_id = req.body.system_id || req.headers['user-agent'] || 'unknown';

    // Generate a new session token
    const sessionToken = uuidv4();
    user.session_token = sessionToken;
    await user.save();

    // Include sessionToken in JWT
    const token = jwt.sign(
        { id: user._id, user_id: user.user_id, role: user.role, session_token: sessionToken },
        process.env.JWT_SECRET,
        { expiresIn: '7d' }
    );

    // Log the login action
    await logAction({
        user_id: user.user_id,
        action: 'login',
        details: `User logged in from IP: ${ip}, System: ${system_id}`,
        ip,
        system_id
    });

    res.status(200).json({
        _id: user._id,
        name: user.name,
        user_id: user.user_id,
        roll_number: user.roll_number,
        role: user.role,
        token
    });
});

// ...rest of your routes (get_users, update, delete, logout, etc.)...

// Get all users
router.get('/get_users', protect, authorize('admin'), async (req, res) => {
  try {
    const users = await User.find().select('-password');
    res.json(users);
  } catch (error) {
    res.status(500).json({ message: 'Error fetching users' });
  }
});
// Update user
router.put('/update/users/:id', protect, authorize('admin'), async (req, res) => {
    try {
        const updateFields = { ...req.body };
        // Only allow updating allowed fields
        const allowedFields = ['name', 'user_id', 'roll_number', 'role'];
        Object.keys(updateFields).forEach(key => {
            if (!allowedFields.includes(key)) {
                delete updateFields[key];
            }
        });

        const user = await User.findByIdAndUpdate(
            req.params.id,
            { $set: updateFields },
            { new: true }
        ).select('-password');
        res.json(user);
        // Log the action
        await logAction({
            user_id: req.user.user_id || 'system',
            action: 'update_user',
            details: `Updated user ${user.user_id} (${user.role})`
        });
    } catch (error) {
        res.status(500).json({ message: 'Error updating user' });
    }
});

// Delete user
router.delete('/delete/users/:id', protect, authorize('admin'), async (req, res) => {
  try {
    const user = await User.findByIdAndDelete(req.params.id);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }
    // Log the action
    await logAction({
      user_id: req.user.user_id || 'system',
      action: 'delete_user',
      details: `Deleted user with ID ${user.user_id})`
    });
    res.json({ message: `User ${user.user_id} deleted successfully` });
  } catch (error) {
    res.status(500).json({ message: 'Error deleting user' });
  }
});

// Add this route before module.exports
router.post('/logout', protect, async (req, res) => {
  try {
    // req.user is set by your protect middleware and contains the user's ID
    const user = await User.findById(req.user.id);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }
    user.session_token = null;
    await user.save();

    await logAction({
      user_id: user.user_id,
      action: 'logout',
      details: 'User logged out and session_token cleared'
    });

    res.json({ message: 'Logged out successfully' });
  } catch (error) {
    res.status(500).json({ message: 'Logout failed' });
  }
});

module.exports = router;