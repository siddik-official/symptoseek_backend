const mongoose = require("mongoose");

// Doctor Model
const doctorSchema = new mongoose.Schema({
    name: { type: String, required: true },
    specialty: { type: String, required: true },
    location: { type: String, required: true },
    contact: { type: String, required: true }
  });
  const Doctor = mongoose.model("Doctor", doctorSchema);