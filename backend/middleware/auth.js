const jwt = require('jsonwebtoken');
const User = require('../models/User');

exports.protect = async (req, res, next) => {
    let token = req.headers.authorization?.split(' ')[1];
    if (!token) {
        return res.status(401).json({ message: 'Not authorized, no token' });
    }
    try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        const user = await User.findById(decoded.id);

        // For new session logic: check if session_token is present in user's sessions array
        let validSession = false;
        if (user && Array.isArray(user.sessions)) {
            validSession = user.sessions.some(s => s.token === decoded.session_token);
        }
        // For legacy (single session_token)
        if (user && user.session_token && user.session_token === decoded.session_token) {
            validSession = true;
        }
        if (!user || !validSession) {
            return res.status(401).json({ message: 'Session expired or logged in elsewhere.' });
        }
        req.user = user;
        next();
    } catch (error) {
        return res.status(401).json({ message: 'Not authorized, token failed' });
    }
};

exports.authorize = (...roles) => {
    return (req, res, next) => {
        if (!roles.includes(req.user.role)) {
            return res.status(403).json({ message: 'Not authorized' });
        }
        next();
    };
};
