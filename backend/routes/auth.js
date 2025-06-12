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

router.post('/register/individual', protect, authorize('admin'), async (req, res) => {
    try {
        const { name, user_id, password, role, roll_number } = req.body;
        
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

        const hashedPassword = await bcrypt.hash(password, 10);
                const userData = {
            name,
            user_id,
            roll_number,
            password: hashedPassword,
            role
        };
        
        // If student, add batch and semester
        if (role === 'student') {
            if (batch) {
                // Validate batch is one of the allowed values
                const validBatch = await Batch.findOne({ name: batch });
                if (!validBatch) {
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
        if (role === 'student' && batch) {
            const batchInfo = await Batch.findById(batch).select('name');
            const batchName = batchInfo ? batchInfo.name : 'unknown batch';
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
            const { name, user_id, roll_number, password, role } = entry;

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

            const newUser = new User({ name, user_id, roll_number, password, role });
            await newUser.save();

            // Log the action
            await logAction({
                user_id: req.user.user_id || 'system',
                action: 'create_user',
                details: `Bulk created user ${user.user_id} (${role})`
            });
            createdUsers.push({ name: newUser.name, user_id: newUser.user_id, roll_number: newUser.roll_number, role: newUser.role });
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

    // Check for existing session
    if (user.session_token) {
        await logAction({
            user_id: user_id,
            action: 'login_attempt',
            details: 'ALERT: user already logged in elsewhere',
            ip: req.headers['x-forwarded-for']?.split(',').shift() ||
                req.socket?.remoteAddress ||
                req.connection?.remoteAddress ||
                '',
            system_id: req.body.system_id || req.headers['user-agent'] || 'unknown'
        });
        return res.status(401).json({ message: 'User is already logged in elsewhere. Please logout first.' });
    }

    // Get IP address
    const ip =
        req.headers['x-forwarded-for']?.split(',').shift() ||
        req.socket?.remoteAddress ||
        req.connection?.remoteAddress ||
        '';

    // Get system info from request (see next step)
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

// This code defines an Express.js router for user authentication, including registration and login functionality.
// It uses JWT for token generation and includes middleware for protecting routes and authorizing user roles.         
// The `/register` route allows an admin to create new users with specified roles (faculty or student).
// The `/login` route allows users to authenticate with their user_id and password, returning a JWT token upon successful login.
// The code also includes error handling for duplicate users and invalid credentials.
// The `generateToken` function creates a JWT token with the user's ID and role, which is used for subsequent authentication.
// The router is exported for use in the main application file, allowing it to be mounted on a specific path (e.g., `/api/auth`).
// The code uses async/await for asynchronous operations, ensuring clean and readable code.
// The `protect` and `authorize` middleware functions are used to secure the routes, ensuring that only authenticated users with the appropriate roles can access certain endpoints.
// The code is designed to be modular and reusable, allowing for easy integration into larger applications.
// The use of environment variables (e.g., `process.env.JWT_SECRET`) for sensitive information like the JWT secret key enhances security by keeping such data out of the source code.
// The code follows best practices for user authentication and authorization in a Node.js application, ensuring secure handling of user credentials and roles.
// The `User` model is imported from a separate file, promoting separation of concerns and making the codebase more maintainable.
// The code is structured to allow for future expansion, such as adding more user roles or additional authentication features.
// The use of Mongoose for database interactions simplifies the process of working with MongoDB, providing a clear schema definition and built-in methods for common operations.    