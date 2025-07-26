const mongoose = require("mongoose");

const doctorSchema = new mongoose.Schema({
    image_source: { type: String, required: true },
    name: { type: String, required: true },
    speciality: { type: String, required: true },
    address: { type: String, required: true },
    number: { type: String, required: true },
    visiting_hours: { type: String, required: true },
    degree: { type: String, required: true },
    hospital_name: { type: String, required: true },
    About: { type: String, required: true },
    longitude: { type: String, required: false },
    latitude: { type: String, required: false },
    
});

// Make sure this line exists:
module.exports = mongoose.model("Doctor", doctorSchema);