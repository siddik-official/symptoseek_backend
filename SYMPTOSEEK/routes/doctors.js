const express = require("express");

const Doctor = require("../models/doctors");
const router = express.Router();


router.get("/recommend", /*checkUserSession,*/  async (req, res) => {
  try {
    const { specialty, location } = req.query;
    let query = {};
    if (specialty) query.specialty = specialty;
    if (location) query.location = location;
    const doctors = await Doctor.find(query);
    if (doctors.length === 0) {
      return res.status(404).json({ message: "No doctors found" });
    }
    res.json({ recommendedDoctors: doctors });
  } catch (error) {
    res.status(500).json({ message: "Server error" });
  }
});
module.exports = router;