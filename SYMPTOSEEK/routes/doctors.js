const express = require('express');
const router = express.Router();
const Doctor = require('../models/doctors');
const adminMiddleware = require('../middleware/adminMiddleware'); // <-- IMPORT MIDDLEWARE

// GET all doctors
router.get('/', async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10; // Default 10 doctors per page
    const skip = (page - 1) * limit;

    const doctors = await Doctor.find()
      .skip(skip)
      .limit(limit);

    const total = await Doctor.countDocuments();
    const totalPages = Math.ceil(total / limit);

    res.json({
      doctors,
      pagination: {
        currentPage: page,
        totalPages,
        totalDoctors: total,
        doctorsPerPage: limit
      }
    });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// GET a single doctor by ID
router.get('/:id', getDoctor, (req, res) => {
  res.json(res.doctor);
});

// CREATE a new doctor
router.post('/',adminMiddleware, async (req, res) => {
  const doctor = new Doctor({
    image_sourse: req.body.image_sourse,
    name: req.body.name,
    specialty: req.body.specialty,
    address: req.body.address,
    number: req.body.number,
    visitng_hours: req.body.visitng_hours,
    degree: req.body.degree,
    hospital_name: req.body.hospital_name,
    about: req.body.about
  });

  try {
    const newDoctor = await doctor.save();
    res.status(201).json(newDoctor);
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
});

// UPDATE a doctor
router.patch('/:id',adminMiddleware, getDoctor, async (req, res) => {
  if (req.body.image_sourse != null) {
    res.doctor.image_sourse = req.body.image_sourse;
  }
  if (req.body.name != null) {
    res.doctor.name = req.body.name;
  }
  if (req.body.specialty != null) {
    res.doctor.specialty = req.body.specialty;
  }
  // Add similar checks for all other fields
  if (req.body.address != null) res.doctor.address = req.body.address;
  if (req.body.number != null) res.doctor.number = req.body.number;
  if (req.body.visitng_hours != null) res.doctor.visitng_hours = req.body.visitng_hours;
  if (req.body.degree != null) res.doctor.degree = req.body.degree;
  if (req.body.hospital_name != null) res.doctor.hospital_name = req.body.hospital_name;
  if (req.body.about != null) res.doctor.about = req.body.about;

  try {
    const updatedDoctor = await res.doctor.save();
    res.json(updatedDoctor);
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
});

// DELETE a doctor
router.delete('/:id',adminMiddleware, getDoctor, async (req, res) => {
  try {
    await res.doctor.remove();
    res.json({ message: 'Doctor deleted' });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// Middleware function to get a single doctor by ID
async function getDoctor(req, res, next) {
  let doctor;
  try {
    doctor = await Doctor.findById(req.params.id);
    if (doctor == null) {
      return res.status(404).json({ message: 'Cannot find doctor' });
    }
  } catch (err) {
    return res.status(500).json({ message: err.message });
  }

  res.doctor = doctor;
  next();
}

module.exports = router;