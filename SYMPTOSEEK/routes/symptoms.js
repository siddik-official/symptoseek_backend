const express = require("express");

const router = express.Router();
const Symptom = require("../models/symptoms");
const checkUserSession = require("../middleware/checkUserSession");


router.post("/check", /*checkUserSession,*/  async (req, res) => {
  try {
    const { symptoms } = req.body;
    if (!symptoms || symptoms.length === 0) {
      return res.status(400).json({ message: "No symptoms provided" });
    }
    const matchedSymptoms = await Symptom.find({ name: { $in: symptoms } });
    if (matchedSymptoms.length === 0) {
      return res.status(404).json({ message: "No matching conditions found" });
    }
    res.json({ possibleConditions: matchedSymptoms });
  } catch (error) {
    res.status(500).json({ message: "Server error" });
  }
});
module.exports = router;