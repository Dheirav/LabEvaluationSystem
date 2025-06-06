const express = require('express');
const jwt = require('jsonwebtoken');
const User = require('../models/User');
const { protect,authorize } = require('../middleware/auth');

const router = express.Router();

//
const generateToken = (user) => {
    return jwt.sign(
        { id: user._id, role: user.role },
        process.env.JWT_SECRET,
        { expiresIn: '7d' }
    );
}

router.post('/register',protect, authorize('admin'), async (req, res) => {
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
        res.status(201).json({
            _id: user._id,
            name: user.name,
            user_id: user.user_id,
            role: user.role,
            token: generateToken(user)
        });
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