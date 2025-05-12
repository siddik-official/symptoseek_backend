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
      // Check for existing appointments at the same time
      const existingAppointment = await Appointment.findOne({
        doctors_id,
        date,
        status: { $ne: 'Cancelled' } // Assuming cancelled appointments don't count
      });
  
      if (existingAppointment) {
        return res.status(400).json({ message: "Doctor already has an appointment at this time" });
      }
  
      const appointment = new Appointment({
        doctors_id,
        userId: req.user.id,
        date,
        reason
      });
  
      const savedAppointment = await appointment.save();
      res.status(201).json(savedAppointment);
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
            select: 'name speciality address number visitng_hours degree hospital_name',
            model: 'Doctor' // explicitly specify the model
        })
          .sort({ date: 1 }); // Sort by date ascending

      res.json(appointments);
  } catch (err) {
      res.status(500).json({ message: err.message });
  }
});

  module.exports = router;