// routes/admin.js

const express = require('express');
const router = express.Router();
const User = require('../models/user');
const Doctor = require('../models/doctors'); // Assuming this is your doctor model
const adminMiddleware = require('../middleware/adminMiddleware');
const bcrypt = require('bcryptjs');

// Apply adminMiddleware to all routes in this file
router.use(adminMiddleware);

// --- DASHBOARD ---
// GET /api/admin/dashboard-stats
router.get('/dashboard-stats', async (req, res) => {
    try {
        const userCount = await User.countDocuments();
        const doctorCount = await Doctor.countDocuments();
        // Add more stats as needed
        res.json({
            users: userCount,
            doctors: doctorCount
        });
    } catch (error) {
        res.status(500).json({ message: 'Server Error', error: error.message });
    }
});


// --- USER MANAGEMENT ---

// GET /api/admin/users - Get all users
router.get('/users', async (req, res) => {
    try {
        const users = await User.find().select('-password'); // Exclude passwords
        res.json(users);
    } catch (error) {
        res.status(500).json({ message: 'Server Error', error: error.message });
    }
});

// GET /api/admin/users/:id - Get a single user by ID
router.get('/users/:id', async (req, res) => {
    try {
        const user = await User.findById(req.params.id).select('-password');
        if (!user) return res.status(404).json({ message: 'User not found' });
        res.json(user);
    } catch (error) {
        res.status(500).json({ message: 'Server Error', error: error.message });
    }
});


// POST /api/admin/users - Create a new user (by admin)
router.post('/users', async (req, res) => {
    const { name, email, password, role } = req.body;
    try {
        let user = await User.findOne({ email });
        if (user) return res.status(400).json({ message: 'User with this email already exists' });
        
        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(password, salt);

        user = new User({
            name,
            email,
            password: hashedPassword,
            role: role || 'user', // Admin can specify role, defaults to 'user'
            isVerified: true // Admin-created users can be pre-verified
        });

        await user.save();
        const userResponse = user.toObject();
        delete userResponse.password;

        res.status(201).json({ message: 'User created successfully by admin', user: userResponse });
    } catch (error) {
        res.status(500).json({ message: 'Server Error', error: error.message });
    }
});


// PUT /api/admin/users/:id - Update a user (e.g., change role)
router.put('/users/:id', async (req, res) => {
    const { name, email, role } = req.body;
    try {
        const updateData = { name, email, role };
        // Remove undefined fields so we don't overwrite with null
        Object.keys(updateData).forEach(key => updateData[key] === undefined && delete updateData[key]);

        const user = await User.findByIdAndUpdate(
            req.params.id, 
            { $set: updateData },
            { new: true }
        ).select('-password');

        if (!user) return res.status(404).json({ message: 'User not found' });
        
        res.json({ message: 'User updated successfully', user });
    } catch (error) {
        res.status(500).json({ message: 'Server Error', error: error.message });
    }
});

// DELETE /api/admin/users/:id - Delete a user
router.delete('/users/:id', async (req, res) => {
    try {
        const user = await User.findById(req.params.id);
        if (!user) return res.status(404).json({ message: 'User not found' });

        // Optional: Prevent an admin from deleting themselves
        if (user._id.toString() === req.user.userId) {
            return res.status(400).json({ message: "Admin cannot delete their own account." });
        }
        
        await User.findByIdAndRemove(req.params.id);
        res.json({ message: 'User deleted successfully' });
    } catch (error) {
        res.status(500).json({ message: 'Server Error', error: error.message });
    }
});

module.exports = router;