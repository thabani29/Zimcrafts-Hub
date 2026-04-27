// backend/src/middleware/auth.js
const jwt = require('jsonwebtoken');
const User = require('../models/User');

// PROTECT: checks JWT from cookie or Authorization header
exports.protect = async(req, res, next) => {
    try {
        let token = req.cookies.accessToken;

        // Fallback to Authorization header
        if (!token && req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
            token = req.headers.authorization.split(' ')[1];
        }

        if (!token) {
            return res.status(401).json({ success: false, message: 'Not authorized' });
        }

        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        const user = await User.findById(decoded.id);

        if (!user) {
            return res.status(401).json({ success: false, message: 'Not authorized' });
        }

        req.user = user;
        next();
    } catch (err) {
        return res.status(401).json({ success: false, message: 'Not authorized' });
    }
};

// AUTHORIZE: restrict routes to certain roles
exports.authorize = (...roles) => {
    return (req, res, next) => {
        if (!req.user || !roles.includes(req.user.role)) {
            return res.status(403).json({ success: false, message: 'User not authorized' });
        }
        next();
    };
};