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

const router = express.Router();

const allowedBatches = ['N', 'P', 'Q'];


router.post('/register/individual', protect, authorize('admin'), async (req, res) => {
    try {
        const { name, user_id, password, role, roll_number, batch, semester } = req.body;
        
        if(!['faculty', 'student'].includes(role)) {
            return res.status(400).json({ message: 'Invalid role' });
        }

        const existingUser = await User.findOne({ 
            $or: [
                { user_id },
                { roll_number }
            ]
        });
        
        if (existingUser) {
            return res.status(400).json({ 
                message: existingUser.user_id === user_id 
                    ? 'User already exists' 
                    : 'Roll number already exists'
            });
        }

        // REMOVE manual password hashing here!
        // const hashedPassword = await bcrypt.hash(password, 10);
        const userData = {
            name,
            user_id,
            roll_number,
            password, // pass plain password, let User model hash it
            role
        };
        
        // If student, add batch and semester
        if (role === 'student') {
            if (batch) {
                if (!allowedBatches.includes(batch)) {
                    return res.status(400).json({ message: 'Invalid batch' });
                }
                userData.batch = batch;
            }
            
            // Add semester if provided
            if (semester) {
                userData.semester = semester;
            }
        }
        
        const user = new User(userData);
        await user.save();

        // Create action details with batch info for logging
        let actionDetails = `Created user ${user.user_id} (${role})`;
        if (role === 'student' && user.batch) {
            const batchName = allowedBatches.includes(user.batch) ? user.batch : 'Unknown batch';
            actionDetails += ` assigned to batch ${batchName}, semester ${user.semester || 1}`;
        }

        await logAction({
          user_id: req.user.user_id || 'system',
          action: 'create_user',
          details: actionDetails
        });

        // Return response including batch info if relevant
        const response = {
            message: 'User registered successfully',
            user: {
                _id: user._id,
                name: user.name,
                roll_number: user.roll_number,
                user_id: user.user_id,
                role: user.role
            }
        };
        
        if (role === 'student') {
            response.user.batch = user.batch;
            response.user.semester = user.semester || 1;
        }

        return res.status(201).json(response);

    } catch (error) {
        console.error('Registration error:', error);
        return res.status(500).json({ message: 'Error registering user' });
    }
});

router.post('/register/bulk', protect, authorize('admin'), multerUpload.single('file'), async (req, res) => {
    if (!req.file) return res.status(400).json({ message: 'No file uploaded' });

    const ext = req.file.originalname.split('.').pop().toLowerCase();
    let parsedUsers = [];

    try {
        if (!['xlsx', 'xls', 'csv', 'json', 'pdf'].includes(ext)) {
            return res.status(400).json({ message: 'Unsupported file format' });
        }

        if (['xlsx', 'xls', 'csv'].includes(ext)) {
            const workbook = xlsx.read(req.file.buffer, { type: 'buffer' });
            const sheet = workbook.Sheets[workbook.SheetNames[0]];
            parsedUsers = xlsx.utils.sheet_to_json(sheet);
        }
        
        else if (ext === 'json') {
            const jsonData = JSON.parse(req.file.buffer.toString());
            parsedUsers = Array.isArray(jsonData) ? jsonData : jsonData.users || [];
            
            if (!Array.isArray(parsedUsers)) {
                return res.status(400).json({ 
                    message: 'Invalid JSON format. Expected an array of users or an object with a users array' 
                });
            }
        }
        else if (ext === 'pdf') {
            const dataBuffer = req.file.buffer;
            const pdfData = await pdfParse(dataBuffer);
            const text = pdfData.text;
        
            const lines = text
                .split('\n')
                .map(line => line.trim())
                .filter(line => line && !line.toLowerCase().includes('name'))  // Skip headers
        
            const parsed = [];
        
            for (const line of lines) {
                let cleaned = line.replace(/\s{2,}/g, ','); // Convert large spaces to commas
        
                // Fallback: if not enough fields, try manually fixing delimiters
                if ((cleaned.match(/,/g) || []).length < 4) {
                    cleaned = line.replace(/\s+/g, ',');
                }
        
                // Now expecting: name, user_id, roll_number, password, role
                const [name, user_id, roll_number, password, role] = cleaned.split(',').map(x => x?.trim());
        
                if (!name || !user_id || !roll_number || !password || !role) {
                    console.warn(`Skipping malformed line: "${line}"`);
                    continue;
                }
        
                if (!['student', 'faculty'].includes(role.toLowerCase())) {
                    console.warn(`Invalid role: "${role}"`);
                    continue;
                }
        
                parsed.push({
                    name,
                    user_id,
                    roll_number,
                    password,
                    role: role.toLowerCase()
                });
            }
        
            parsedUsers = parsed;
        }
        
        if (!parsedUsers || parsedUsers.length === 0) {
            return res.status(400).json({ message: 'No valid users found in file' });
        }

        const createdUsers = [];
        const errors = [];


        for (const entry of parsedUsers) {
            const { name, user_id, roll_number, password, role, batch, semester } = entry;
        
            if (!name || !user_id || !roll_number || !password || !['student', 'faculty'].includes(role)) {
                errors.push({ user_id, message: 'Invalid or missing fields' });
                continue;
            }
        
            const existing = await User.findOne({ 
                $or: [
                    { user_id },
                    { roll_number }
                ]
            });
            if (existing) {
                errors.push({ user_id, message: existing.user_id === user_id ? 'User already exists' : 'Roll number already exists' });
                continue;
            }
        
            const userData = { name, user_id, roll_number, password, role };
        
            // If student, add batch and semester
            if (role === 'student') {
                if (batch) {
                    if (!allowedBatches.includes(batch)) {
                        errors.push({ user_id, message: 'Invalid batch' });
                        continue;
                    }
                    userData.batch = batch;
                }
                if (semester) {
                    userData.semester = semester;
                }
            }
        
            const newUser = new User(userData);
            await newUser.save();
        
            // Log the action
            await logAction({
                user_id: req.user.user_id || 'system',
                action: 'create_user',
                details: `Bulk created user ${newUser.user_id} (${role})${userData.batch ? ` assigned to batch ${userData.batch}` : ''}${userData.semester ? `, semester ${userData.semester}` : ''}`
            });
            createdUsers.push({ name: newUser.name, user_id: newUser.user_id, roll_number: newUser.roll_number, role: newUser.role, batch: newUser.batch, semester: newUser.semester });
        }

        return res.status(207).json({
            message: 'File processed',
            created: createdUsers,
            errors
        });

    } catch (error) {
        console.error('Error processing file:', error);
        return res.status(500).json({ message: 'Failed to process file' });
    }
});

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
        // At this point, req.user is guaranteed to exist and be admin due to authorize('admin')
        const updateFields = { ...req.body };
        // Allow updating only these fields
        const allowedFields = ['name', 'user_id', 'roll_number', 'role', 'batch', 'semester', 'department'];
        Object.keys(updateFields).forEach(key => {
            if (!allowedFields.includes(key)) {
                delete updateFields[key];
            }
        });

        // Validate batch if present
        if (updateFields.batch && !allowedBatches.includes(updateFields.batch)) {
            return res.status(400).json({ message: 'Invalid batch' });
        }

        // Find and update user
        const user = await User.findByIdAndUpdate(
            req.params.id,
            { $set: updateFields },
            { new: true }
        ).select('-password');

        if (!user) {
            return res.status(404).json({ message: 'User not found' });
        }

        // Log the action
        await logAction({
            user_id: req.user.user_id || 'system',
            action: 'update_user',
            details: `Updated user ${user.user_id} (${user.role})`
        });

        res.json(user);
    } catch (error) {
        if (error.name === 'JsonWebTokenError' || error.name === 'TokenExpiredError') {
            return res.status(401).json({ message: 'Unauthorized: Invalid or expired token.' });
        }
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

// Assign courses to faculty (admin only)
router.put('/faculty/:id/assign-courses', protect, authorize('admin'), async (req, res) => {
  try {
    let { courseIds } = req.body;
    const user = await User.findById(req.params.id);
    if (!user || user.role !== 'faculty') {
      return res.status(404).json({ message: 'Faculty not found' });
    }

    // Always resolve all codes to ObjectId, allow for mixed input (ObjectId or code)
    const Course = require('../models/Course');
    const mongoose = require('mongoose');
    const codes = [];
    const objectIds = [];
    for (const id of courseIds) {
      if (typeof id === 'string' && id.length < 24) {
        codes.push(id);
      } else if (mongoose.Types.ObjectId.isValid(id)) {
        objectIds.push(id);
      }
    }
    let resolvedIds = [...objectIds];
    if (codes.length > 0) {
      const courses = await Course.find({ code: { $in: codes } });
      // Debug log
      console.log('Assigning codes:', codes);
      console.log('Found codes:', courses.map(c => c.code));
      if (courses.length !== codes.length) {
        const foundCodes = courses.map(c => c.code);
        const missing = codes.filter(code => !foundCodes.includes(code));
        return res.status(400).json({ message: 'Some course codes not found', missing });
      }
      resolvedIds = [...resolvedIds, ...courses.map(c => c._id.toString())];
    }

    // Remove duplicates and ensure all are strings (ObjectId as string)
    user.assignedCourses = Array.from(new Set(resolvedIds));
    await user.save();
    res.json({ message: 'Courses assigned successfully', assignedCourses: user.assignedCourses });
  } catch (err) {
    console.error('Assign courses error:', err);
    res.status(500).json({ message: 'Failed to assign courses' });
  }
});

// Assign batches for a course to a faculty
router.put('/faculty/:id/assign-course-batches', protect, authorize('admin'), async (req, res) => {
  try {
    const { courseId, batches, assignedCourseBatches } = req.body;
    const user = await User.findById(req.params.id);
    if (!user || user.role !== 'faculty') {
      return res.status(404).json({ message: 'Faculty not found' });
    }
    const Course = require('../models/Course');
    const mongoose = require('mongoose');

    // Helper to resolve course code to ObjectId
    async function resolveCourseId(idOrCode) {
      if (mongoose.Types.ObjectId.isValid(idOrCode)) return idOrCode;
      // Try to resolve as code
      const courseDoc = await Course.findOne({ code: idOrCode });
      if (!courseDoc) throw new Error(`Course not found for code: ${idOrCode}`);
      return courseDoc._id;
    }

    if (Array.isArray(assignedCourseBatches)) {
      // Convert all course codes to ObjectIds if needed
      const resolved = [];
      for (const item of assignedCourseBatches) {
        if (!item.course || !Array.isArray(item.batches) || item.batches.length === 0) {
          return res.status(400).json({ message: 'Each assignment must have a course and at least one batch.' });
        }
        const resolvedCourseId = await resolveCourseId(item.course);
        resolved.push({ course: resolvedCourseId, batches: item.batches });
      }
      user.assignedCourseBatches = resolved;
      await user.save();
      return res.json({ message: 'Course batches assigned', assignedCourseBatches: user.assignedCourseBatches });
    }

    // Legacy: assign one courseId+batches at a time
    if (!courseId || !Array.isArray(batches) || batches.length === 0) {
      return res.status(400).json({ message: 'Course and batches are required' });
    }
    const resolvedCourseId = await resolveCourseId(courseId);
    user.assignedCourseBatches = (user.assignedCourseBatches || []).filter(
      entry => entry.course.toString() !== resolvedCourseId.toString()
    );
    user.assignedCourseBatches.push({ course: resolvedCourseId, batches });
    await user.save();
    res.json({ message: 'Course batches assigned', assignedCourseBatches: user.assignedCourseBatches });
  } catch (err) {
    console.error('Assign course batches error:', err);
    console.error('Request body:', req.body);
    res.status(500).json({ message: 'Failed to assign course batches', error: err.message, stack: err.stack });
  }
});

// Get all courses (for admin UI)
router.get('/courses', protect, authorize('admin'), async (req, res) => {
  try {
    const Course = require('../models/Course');
    const courses = await Course.find();
    res.json(courses);
  } catch (err) {
    res.status(500).json({ message: 'Failed to fetch courses' });
  }
});

// Get courses assigned to a faculty (for faculty dashboard)
router.get('/faculty/courses', protect, authorize('faculty'), async (req, res) => {
  try {
    // Always fetch the latest user with populated assignedCourseBatches.course
    const user = await User.findById(req.user.id)
      .populate({
        path: 'assignedCourseBatches.course',
        select: 'name code'
      })
      .lean();

    if (!user) return res.status(404).json({ message: 'Faculty not found' });

    // --- CRITICAL: Only return assignedCourseBatches, ignore legacy assignedCourses ---
    // Optionally, clear out assignedCourses if you want to fully migrate:
    // await User.findByIdAndUpdate(req.user.id, { $set: { assignedCourses: [] } });

    // Only return courses that are actually assigned in assignedCourseBatches
    const result = (user.assignedCourseBatches || []).map(acb => {
      let courseObj = acb.course && typeof acb.course === 'object'
        ? acb.course
        : null;
      return {
        _id: courseObj?._id || acb.course,
        name: courseObj?.name || '',
        code: courseObj?.code || '',
        batches: acb.batches
      };
    });

    res.json(result);
  } catch (err) {
    console.error('faculty/courses error:', err);
    res.status(500).json({ message: 'Failed to fetch assigned courses' });
  }
});

// Utility route: Clear legacy assignedCourses for all faculty (run once, then remove!)
// WARNING: This is a destructive operation. Use only for migration/cleanup.
router.post('/admin/clear-legacy-assigned-courses', protect, authorize('admin'), async (req, res) => {
  try {
    // Remove assignedCourses for all faculty
    const result = await User.updateMany(
      { role: 'faculty' },
      { $unset: { assignedCourses: "" } }
    );
    res.json({ message: 'Legacy assignedCourses field removed for all faculty', result });
  } catch (err) {
    res.status(500).json({ message: 'Failed to remove legacy assignedCourses', error: err.message });
  }
});

module.exports = router;