const express = require("express");
// const bcrypt = require("bcryptjs");
// const jwt = require("jsonwebtoken");
const EmergencyAlert = require("../models/emergency-alert");
const checkUserSession = require("../middleware/checkUserSession");
const router = express.Router();



router.post("/alert", /*checkUserSession,*/ async (req, res) => {
    try {
      const { location, emergencyType } = req.body;
      const alert = new EmergencyAlert({ userId: req.session.userId, location, emergencyType });
      await alert.save();
      res.json({ message: "Emergency alert sent successfully" });
    } catch (error) {
      res.status(500).json({ message: "Server error" });
    }
  });
  module.exports = router;
