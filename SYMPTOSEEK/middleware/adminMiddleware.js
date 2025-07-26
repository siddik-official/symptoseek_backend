// middleware/adminMiddleware.js

const jwt = require('jsonwebtoken');
const User = require('../models/user');

const adminMiddleware = async (req, res, next) => {
    // 1. Get token from header
    const authHeader = req.header('Authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
        return res.status(401).json({ message: 'No token, authorization denied' });
    }
    
    const token = authHeader.split(' ')[1];

    try {
        // 2. Verify token
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        
        // 3. Find user and check role
        //    Make sure to select the 'role' field
        const user = await User.findById(decoded.userId).select('role').lean();

        if (!user) {
            return res.status(401).json({ message: 'User not found, authorization denied' });
        }

        // 4. Check if the user is an admin
        if (user.role !== 'admin') {
            return res.status(403).json({ message: 'Forbidden: Access is restricted to administrators.' });
        }

        // 5. Attach user ID to request and proceed
        req.user = { 
            id: decoded.userId,
            userId: decoded.userId 
        }; // Consistent with authMiddleware
        next();

    } catch (err) {
        console.error('Admin middleware error:', err.message);
        res.status(401).json({ message: 'Token is not valid' });
    }
};

module.exports = adminMiddleware;