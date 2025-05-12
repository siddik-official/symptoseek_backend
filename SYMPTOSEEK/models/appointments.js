const mongoose = require('mongoose');

const appointmentSchema = new mongoose.Schema({
  doctors_id: { type: mongoose.Schema.Types.ObjectId, ref: 'doctors', required: true },
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'users', required: true },
  date: { type: Date, required: true },
  reason: { type: String },
  status: { type: String, default: 'Pending' }
});

module.exports = mongoose.model('Appointment', appointmentSchema);
