const express = require('express');
const jwt = require('jsonwebtoken');
const xlsx = require('xlsx');
const pdfParse = require('pdf-parse')
const User = require('../models/User');
const { protect,authorize } = require('../middleware/auth');
const multerUpload = require('../middleware/upload');

const router = express.Router();

const generateToken = (user) => {
    return jwt.sign(
        { id: user._id, role: user.role },
        process.env.JWT_SECRET,
        { expiresIn: '7d' }
    );
}

router.post('/register/individual',protect, authorize('admin'), async (req, res) => {
    const { name, user_id, password, role } = req.body;
    
    if(!['faculty', 'student'].includes(role)) {
        return res.status(400).json({ message: 'Invalid role' });
    }

    const existingUser = await User.findOne({ user_id });
    if (existingUser) {
        return res.status(400).json({ message: 'User already exists' });
    }
    const user = new User({
        name,
        user_id,
        password,
        role
    });
    try {
        await user.save();
    } catch (error) {
        res.status(500).json({ message: 'Error registering user' });
    }
    res.status(201).json({
        message: 'User registered successfully',
        user: {
            _id: user._id,
            name: user.name,
            user_id: user.user_id,
            role: user.role
        }
    });
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
                if ((cleaned.match(/,/g) || []).length < 3) {
                    cleaned = line.replace(/\s+/g, ',');
                }
        
                const [name, user_id, password, role] = cleaned.split(',').map(x => x?.trim());
        
                if (!name || !user_id || !password || !role) {
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
            const { name, user_id, password, role } = entry;

            if (!name || !user_id || !password || !['student', 'faculty'].includes(role)) {
                errors.push({ user_id, message: 'Invalid or missing fields' });
                continue;
            }

            const existing = await User.findOne({ user_id });
            if (existing) {
                errors.push({ user_id, message: 'User already exists' });
                continue;
            }

            const newUser = new User({ name, user_id, password, role });
            await newUser.save();
            createdUsers.push({ name: newUser.name, user_id: newUser.user_id, role: newUser.role });
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
        return res.status(401).json({ message: 'Invalid user_id' });
    }
    const isMatch = await user.comparePassword(password);
    if (!isMatch) {
        return res.status(401).json({ message: 'Invalid password' });
    }

    const token = generateToken(user);
    res.status(200).json({
        _id: user._id,
        name: user.name,
        user_id: user.user_id,
        role: user.role,
        token
    });
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