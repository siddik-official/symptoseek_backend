const mongoose = require("mongoose");

const doctorSchema = new mongoose.Schema({
    image_sourse: { type: String, required: true },
    name: { type: String, required: true },
    speciality: { type: String, required: true },
    address: { type: String, required: true },
    number: { type: String, required: true },
    visitng_hours: { type: String, required: true },
    degree: { type: String, required: true },
    hospital_name: { type: String, required: true },
    about: { type: String, required: true }
});

// Make sure this line exists:
module.exports = mongoose.model("Doctor", doctorSchema);