const mongoose = require("mongoose");

// Symptom Model
const symptomSchema = new mongoose.Schema({
    name: { type: String, required: true },
    conditions: [{ type: String, required: true }]
  });
  const Symptom = mongoose.model("Symptom", symptomSchema);