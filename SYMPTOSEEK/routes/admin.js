// routes/admin.js

const express = require('express');
const router = express.Router();
const User = require('../models/user');
const Doctor = require('../models/doctors'); // Assuming this is your doctor model
const Appointment = require('../models/appointments'); // Add appointment model
const Report = require('../models/reports'); // Add reports model
const adminMiddleware = require('../middleware/adminMiddleware');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

// --- ADMIN AUTH ROUTES (NO MIDDLEWARE) ---

// POST /api/admin/login - Admin login
router.post('/login', async (req, res) => {
    console.log('Admin Login route hit!'); // Debug log
    const { email, password } = req.body;

    try {
        // Find admin user
        const admin = await User.findOne({ email, role: 'admin' });
        
        if (!admin) {
            return res.status(401).json({ message: 'Invalid admin credentials' });
        }

        // Check password
        const isMatch = await bcrypt.compare(password, admin.password);
        
        if (!isMatch) {
            return res.status(401).json({ message: 'Invalid admin credentials' });
        }

        // Create JWT token
        const payload = {
            userId: admin._id,
            role: admin.role
        };

        const token = jwt.sign(payload, process.env.JWT_SECRET, { expiresIn: '24h' });

        res.json({
            message: 'Admin login successful',
            token,
            admin: {
                id: admin._id,
                name: admin.name,
                email: admin.email,
                role: admin.role
            }
        });
    } catch (error) {
        console.error('Admin login error:', error);
        res.status(500).json({ message: 'Server Error', error: error.message });
    }
});

// POST /api/admin/create-admin - Create first admin (for setup)
router.post('/create-admin', async (req, res) => {
    try {
        // Check if any admin already exists
        const existingAdmin = await User.findOne({ role: 'admin' });
        
        if (existingAdmin) {
            return res.status(400).json({ message: 'Admin already exists' });
        }

        const { name, email, password } = req.body;

        // Hash password
        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(password, salt);

        // Create admin user
        const admin = new User({
            name: name || 'Admin',
            email: email || 'admin@symptoseek.com',
            password: hashedPassword,
            role: 'admin',
            isVerified: true
        });

        await admin.save();

        res.json({
            message: 'Admin created successfully',
            admin: {
                id: admin._id,
                name: admin.name,
                email: admin.email,
                role: admin.role
            }
        });
    } catch (error) {
        console.error('Create admin error:', error);
        res.status(500).json({ message: 'Server Error', error: error.message });
    }
});

// --- PROTECTED ADMIN ROUTES (WITH MIDDLEWARE) ---

// Apply adminMiddleware to all routes below this point
router.use(adminMiddleware);

// --- DASHBOARD ---
// GET /api/admin/dashboard-stats
router.get('/dashboard-stats', async (req, res) => {
    try {
        const userCount = await User.countDocuments();
        const doctorCount = await Doctor.countDocuments();
        const appointmentCount = await Appointment.countDocuments();
        
        // Get appointment statistics
        const appointmentStats = await Appointment.aggregate([
            {
                $group: {
                    _id: "$status",
                    count: { $sum: 1 }
                }
            }
        ]);
        
        // Format appointment stats for easier consumption
        const appointmentStatusCounts = {
            pending: 0,
            approved: 0,
            rejected: 0,
            cancelled: 0,
            completed: 0
        };
        
        appointmentStats.forEach(stat => {
            if (stat._id) {
                appointmentStatusCounts[stat._id.toLowerCase()] = stat.count;
            }
        });
        
        res.json({
            users: userCount,
            doctors: doctorCount,
            appointments: appointmentCount,
            appointmentStatusBreakdown: appointmentStatusCounts
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

// Delete user
router.delete('/users/:id', adminMiddleware, async (req, res) => {
    try {
        console.log('Attempting to delete user with ID:', req.params.id);
        
        const user = await User.findByIdAndDelete(req.params.id);
        
        if (!user) {
            console.log('User not found with ID:', req.params.id);
            return res.status(404).json({ message: 'User not found' });
        }
        
        console.log('Successfully deleted user:', user.name);
        res.json({ message: 'User deleted successfully' });
    } catch (error) {
        console.error('Error deleting user:', error);
        res.status(500).json({ 
            message: 'Failed to delete user',
            error: error.message 
        });
    }
});

// --- APPOINTMENT MANAGEMENT ---

// GET /api/admin/appointments - Get all appointments with filters
router.get('/appointments', async (req, res) => {
    try {
        const { status, page = 1, limit = 12, sortBy = 'createdAt', sortOrder = 'desc' } = req.query;
        const skip = (page - 1) * limit;
        
        let filter = {};
        if (status && status !== 'all') {
            filter.status = status;
        }
        
        const sortOptions = {};
        sortOptions[sortBy] = sortOrder === 'asc' ? 1 : -1;
        
        const appointments = await Appointment.find(filter)
            .populate({
                path: 'doctors_id',
                select: 'name speciality address number visiting_hours degree hospital_name',
                model: 'Doctor'
            })
            .populate({
                path: 'userId',
                select: 'name email phone profile_pic',
                model: 'User'
            })
            .populate({
                path: 'adminId',
                select: 'name email',
                model: 'User'
            })
            .sort(sortOptions)
            .skip(skip)
            .limit(parseInt(limit));
        
        const total = await Appointment.countDocuments(filter);
        
        res.json({
            appointments,
            pagination: {
                total,
                page: parseInt(page),
                pages: Math.ceil(total / limit),
                limit: parseInt(limit)
            }
        });
    } catch (error) {
        res.status(500).json({ message: 'Server Error', error: error.message });
    }
});

// PATCH /api/admin/appointments/:id/approve - Approve an appointment
router.patch('/appointments/:id/approve', async (req, res) => {
    try {
        const { adminNote } = req.body;
        const appointmentId = req.params.id;
        
        const appointment = await Appointment.findById(appointmentId);
        
        if (!appointment) {
            return res.status(404).json({ message: "Appointment not found" });
        }
        
        if (appointment.status !== 'Pending') {
            return res.status(400).json({ message: "Only pending appointments can be approved" });
        }
        
        // Check for conflicting approved appointments
        const conflictingAppointment = await Appointment.findOne({
            doctors_id: appointment.doctors_id,
            date: appointment.date,
            status: 'Approved',
            _id: { $ne: appointmentId }
        });
        
        if (conflictingAppointment) {
            return res.status(400).json({ message: "Another appointment is already approved for this time slot" });
        }
        
        // Approve the appointment
        appointment.status = 'Approved';
        appointment.adminId = req.user.userId;
        appointment.adminNote = adminNote || "Approved by admin";
        appointment.approvedAt = new Date();
        
        await appointment.save();
        
        const updatedAppointment = await Appointment.findById(appointmentId)
            .populate({
                path: 'doctors_id',
                select: 'name speciality address number visiting_hours degree hospital_name',
                model: 'Doctor'
            })
            .populate({
                path: 'userId',
                select: 'name email phone',
                model: 'User'
            });
        
        res.json({
            message: "Appointment approved successfully",
            appointment: updatedAppointment
        });
    } catch (error) {
        res.status(500).json({ message: 'Server Error', error: error.message });
    }
});

// PATCH /api/admin/appointments/:id/reject - Reject an appointment
router.patch('/appointments/:id/reject', async (req, res) => {
    try {
        const { adminNote } = req.body;
        const appointmentId = req.params.id;
        
        const appointment = await Appointment.findById(appointmentId);
        
        if (!appointment) {
            return res.status(404).json({ message: "Appointment not found" });
        }
        
        if (appointment.status !== 'Pending') {
            return res.status(400).json({ message: "Only pending appointments can be rejected" });
        }
        
        // Reject the appointment
        appointment.status = 'Rejected';
        appointment.adminId = req.user.userId;
        appointment.adminNote = adminNote || "Rejected by admin";
        appointment.rejectedAt = new Date();
        
        await appointment.save();
        
        const updatedAppointment = await Appointment.findById(appointmentId)
            .populate({
                path: 'doctors_id',
                select: 'name speciality address number visiting_hours degree hospital_name',
                model: 'Doctor'
            })
            .populate({
                path: 'userId',
                select: 'name email phone',
                model: 'User'
            });
        
        res.json({
            message: "Appointment rejected successfully",
            appointment: updatedAppointment
        });
    } catch (error) {
        res.status(500).json({ message: 'Server Error', error: error.message });
    }
});

// GET /api/admin/appointments/:id - Get a specific appointment
router.get('/appointments/:id', async (req, res) => {
    try {
        const appointment = await Appointment.findById(req.params.id)
            .populate({
                path: 'doctors_id',
                select: 'name speciality address number visiting_hours degree hospital_name',
                model: 'Doctor'
            })
            .populate({
                path: 'userId',
                select: 'name email phone address profile_pic',
                model: 'User'
            })
            .populate({
                path: 'adminId',
                select: 'name email',
                model: 'User'
            });
        
        if (!appointment) {
            return res.status(404).json({ message: 'Appointment not found' });
        }
        
        res.json(appointment);
    } catch (error) {
        res.status(500).json({ message: 'Server Error', error: error.message });
    }
});

// PUT /api/admin/appointments/:id - Update appointment status (for generic updates like Completed)
router.put('/appointments/:id', async (req, res) => {
    console.log('PUT /appointments/:id route hit!', req.params.id, req.body);
    try {
        const { status, adminNote } = req.body;
        const appointmentId = req.params.id;
        
        console.log('Updating appointment:', appointmentId, 'to status:', status);
        
        const appointment = await Appointment.findById(appointmentId);
        
        if (!appointment) {
            console.log('Appointment not found:', appointmentId);
            return res.status(404).json({ message: "Appointment not found" });
        }
        
        // Validate status
        const validStatuses = ['Pending', 'Approved', 'Completed', 'Cancelled', 'Rejected'];
        if (!validStatuses.includes(status)) {
            console.log('Invalid status:', status);
            return res.status(400).json({ message: "Invalid status" });
        }
        
        // Update the appointment
        appointment.status = status;
        appointment.adminId = req.user.userId;
        appointment.adminNote = adminNote || `Status updated to ${status} by admin`;
        
        // Add timestamp based on status
        if (status === 'Completed') {
            appointment.completedAt = new Date();
        } else if (status === 'Cancelled') {
            appointment.cancelledAt = new Date();
        }
        
        await appointment.save();
        console.log('Appointment updated successfully');
        
        const updatedAppointment = await Appointment.findById(appointmentId)
            .populate({
                path: 'doctors_id',
                select: 'name speciality address number visiting_hours degree hospital_name',
                model: 'Doctor'
            })
            .populate({
                path: 'userId',
                select: 'name email phone',
                model: 'User'
            });
        
        res.json({
            message: `Appointment ${status.toLowerCase()} successfully`,
            appointment: updatedAppointment
        });
    } catch (error) {
        console.error('PUT route error:', error);
        res.status(500).json({ message: 'Server Error', error: error.message });
    }
});

// DOCTOR MANAGEMENT ROUTES

// GET /api/admin/doctors - Get all doctors with pagination
router.get('/doctors', adminMiddleware, async (req, res) => {
    try {
        const { page = 1, limit = 12, search, speciality } = req.query;
        const skip = (page - 1) * limit;
        
        let filter = {};
        if (search) {
            filter.$or = [
                { name: { $regex: search, $options: 'i' } },
                { speciality: { $regex: search, $options: 'i' } },
                { hospital_name: { $regex: search, $options: 'i' } }
            ];
        }
        if (speciality && speciality !== '') {
            filter.speciality = speciality;
        }
        
        const doctors = await Doctor.find(filter)
            .sort({ createdAt: -1 })
            .skip(skip)
            .limit(parseInt(limit));
        
        const total = await Doctor.countDocuments(filter);
        
        res.json({
            doctors,
            pagination: {
                total,
                page: parseInt(page),
                pages: Math.ceil(total / limit),
                limit: parseInt(limit)
            }
        });
    } catch (error) {
        console.error('Error fetching doctors:', error);
        res.status(500).json({ message: 'Server Error', error: error.message });
    }
});

// POST /api/admin/doctors - Create a new doctor
router.post('/doctors', adminMiddleware, async (req, res) => {
    try {
        const doctor = new Doctor(req.body);
        const savedDoctor = await doctor.save();
        res.status(201).json(savedDoctor);
    } catch (error) {
        console.error('Error creating doctor:', error);
        res.status(500).json({ message: 'Server Error', error: error.message });
    }
});

// PATCH /api/admin/doctors/:id - Update a doctor
router.patch('/doctors/:id', adminMiddleware, async (req, res) => {
    try {
        const doctor = await Doctor.findByIdAndUpdate(
            req.params.id, 
            req.body, 
            { new: true, runValidators: true }
        );
        
        if (!doctor) {
            return res.status(404).json({ message: 'Doctor not found' });
        }
        
        res.json(doctor);
    } catch (error) {
        console.error('Error updating doctor:', error);
        res.status(500).json({ message: 'Server Error', error: error.message });
    }
});

// DELETE /api/admin/doctors/:id - Delete a doctor
router.delete('/doctors/:id', adminMiddleware, async (req, res) => {
    try {
        const doctor = await Doctor.findByIdAndDelete(req.params.id);
        
        if (!doctor) {
            return res.status(404).json({ message: 'Doctor not found' });
        }
        
        res.json({ message: 'Doctor deleted successfully' });
    } catch (error) {
        console.error('Error deleting doctor:', error);
        res.status(500).json({ message: 'Server Error', error: error.message });
    }
});

// --- REPORTS MANAGEMENT ---

// GET /api/admin/reports - Get all reports with pagination
router.get('/reports', adminMiddleware, async (req, res) => {
    try {
        const { page = 1, limit = 12, status, type, search } = req.query;
        const skip = (page - 1) * limit;
        
        let filter = {};
        if (status && status !== '') {
            filter.status = status;
        }
        if (type && type !== '') {
            filter.type = type;
        }
        if (search) {
            filter.$or = [
                { title: { $regex: search, $options: 'i' } },
                { doctor: { $regex: search, $options: 'i' } }
            ];
        }
        
        const reports = await Report.find(filter)
            .populate({
                path: 'user',
                select: 'name email profile_pic',
                model: 'User'
            })
            .sort({ createdAt: -1 })
            .skip(skip)
            .limit(parseInt(limit));
        
        const total = await Report.countDocuments(filter);
        
        res.json({
            reports,
            pagination: {
                total,
                page: parseInt(page),
                pages: Math.ceil(total / limit),
                limit: parseInt(limit)
            }
        });
    } catch (error) {
        console.error('Error fetching reports:', error);
        res.status(500).json({ message: 'Server Error', error: error.message });
    }
});

// GET /api/admin/reports/:id - Get specific report
router.get('/reports/:id', adminMiddleware, async (req, res) => {
    try {
        const report = await Report.findById(req.params.id)
            .populate({
                path: 'user',
                select: 'name email profile_pic phone',
                model: 'User'
            });
        
        if (!report) {
            return res.status(404).json({ message: 'Report not found' });
        }
        
        res.json(report);
    } catch (error) {
        console.error('Error fetching report:', error);
        res.status(500).json({ message: 'Server Error', error: error.message });
    }
});

// PATCH /api/admin/reports/:id - Update report status
router.patch('/reports/:id', adminMiddleware, async (req, res) => {
    try {
        const { status } = req.body;
        
        const report = await Report.findByIdAndUpdate(
            req.params.id,
            { status },
            { new: true, runValidators: true }
        ).populate({
            path: 'user',
            select: 'name email profile_pic',
            model: 'User'
        });
        
        if (!report) {
            return res.status(404).json({ message: 'Report not found' });
        }
        
        res.json({ message: 'Report updated successfully', report });
    } catch (error) {
        console.error('Error updating report:', error);
        res.status(500).json({ message: 'Server Error', error: error.message });
    }
});

// DELETE /api/admin/reports/:id - Delete a report
router.delete('/reports/:id', adminMiddleware, async (req, res) => {
    try {
        const report = await Report.findByIdAndDelete(req.params.id);
        
        if (!report) {
            return res.status(404).json({ message: 'Report not found' });
        }
        
        res.json({ message: 'Report deleted successfully' });
    } catch (error) {
        console.error('Error deleting report:', error);
        res.status(500).json({ message: 'Server Error', error: error.message });
    }
});

module.exports = router;