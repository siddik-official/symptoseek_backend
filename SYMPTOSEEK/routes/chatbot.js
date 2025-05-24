const express = require("express");
const axios = require("axios");
const Doctor = require("../models/doctors");

const router = express.Router();

// Route handler with embedded controller logic
router.post("/predict", async (req, res) => {
  try {
    const { symptoms } = req.body;

    // Call the Python ML service
    const response = await axios.post(
      "http://ml-service:5001/predict",
      { symptoms }
    );

    // Find doctors in the predicted category
    const doctors = await Doctor.find({
      specialization: response.data.predicted_category,
    }).limit(3);

    res.json({
      ...response.data,
      recommended_doctors: doctors,
    });
  } catch (error) {
    res.status(500).json({ error: "Failed to predict disease" });
  }
});

module.exports = router;
