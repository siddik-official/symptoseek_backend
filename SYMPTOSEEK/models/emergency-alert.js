const mongoose = require("mongoose");

// Emergency Alert Model
const emergencyAlertSchema = new mongoose.Schema({
    userId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    location: { type: String, required: true },
    emergencyType: { type: String, required: true },
    timestamp: { type: Date, default: Date.now }
  });
  const EmergencyAlert = mongoose.model("EmergencyAlert", emergencyAlertSchema);
  