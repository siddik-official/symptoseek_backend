const express = require('express');
const router = express.Router();
const jwt = require("jsonwebtoken");
const bcrypt = require("bcryptjs");
const User = require('../models/user');
const Appointment = require('../models/appointments');
const Doctor = require('../models/doctors');
const authMiddleware = require("../middleware/authMiddleware");

// router.post('/test', (req, res) => {
//     res.json({ message: "Test route works!" });
//   });

router.get('/time', (req, res) => {
    res.json({ serverTime: new Date() });
  });


router.post('/', authMiddleware, async (req, res) => {
    const { doctors_id, date, reason } = req.body;
    
    // Basic validation
    if (!doctors_id || !date) {
        return res.status(400).json({ message: "Doctor ID and date are required" });
    }
  
    // Check if date is in the future
    if (new Date(date) < new Date()) {
        return res.status(400).json({ message: "Appointment date must be in the future" });
    }
  
    try {
        // Check for existing approved appointments at the same time
        const existingAppointment = await Appointment.findOne({
            doctors_id,
            date,
            status: 'Approved'
        });
  
        if (existingAppointment) {
            return res.status(400).json({ message: "Doctor already has an approved appointment at this time" });
        }
  
        const appointment = new Appointment({
            doctors_id,
            userId: req.user.id,
            date,
            reason: reason || "General consultation",
            status: 'Pending'
        });
  
        const savedAppointment = await appointment.save();
        
        // Populate doctor details for response
        const populatedAppointment = await Appointment.findById(savedAppointment._id)
            .populate({
                path: 'doctors_id',
                select: 'name speciality address number visiting_hours degree hospital_name',
                model: 'Doctor'
            })
            .populate({
                path: 'userId',
                select: 'name email',
                model: 'User'
            });
        
        res.status(201).json({
            message: "Appointment request submitted successfully. Waiting for admin approval.",
            appointment: populatedAppointment
        });
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
});
// Get all appointments for the authenticated user
router.get('/my-appointments', authMiddleware, async (req, res) => {
    try {
        const appointments = await Appointment.find({ userId: req.user.id })
            .populate({
                path: 'doctors_id',
                select: 'name speciality address number visiting_hours degree hospital_name',
                model: 'Doctor'
            })
            .populate({
                path: 'adminId',
                select: 'name email',
                model: 'User'
            })
            .sort({ createdAt: -1 }); // Sort by creation date descending

        res.json(appointments);
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
});

// Cancel appointment (only by user who created it)
router.patch('/:appointmentId/cancel', authMiddleware, async (req, res) => {
    try {
        const { appointmentId } = req.params;
        const { reason } = req.body;
        
        const appointment = await Appointment.findOne({
            _id: appointmentId,
            userId: req.user.id
        });
        
        if (!appointment) {
            return res.status(404).json({ message: "Appointment not found or you don't have permission to cancel it" });
        }
        
        // Check if appointment can be cancelled
        if (appointment.status === 'Cancelled') {
            return res.status(400).json({ message: "Appointment is already cancelled" });
        }
        
        if (appointment.status === 'Completed') {
            return res.status(400).json({ message: "Cannot cancel a completed appointment" });
        }
        
        // Update appointment status
        appointment.status = 'Cancelled';
        appointment.cancelledAt = new Date();
        appointment.adminNote = reason || "Cancelled by user";
        
        await appointment.save();
        
        const updatedAppointment = await Appointment.findById(appointmentId)
            .populate({
                path: 'doctors_id',
                select: 'name speciality address number visiting_hours degree hospital_name',
                model: 'Doctor'
            });
        
        res.json({
            message: "Appointment cancelled successfully",
            appointment: updatedAppointment
        });
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
});

module.exports = router;