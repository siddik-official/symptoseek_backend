const mongoose = require('mongoose');

const reminderSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      required: true,
      ref: 'User', // This links the reminder to your User model
    },
    title: {
      type: String,
      required: [true, 'Please add a title'],
      trim: true,
    },
    description: {
      type: String,
      trim: true,
    },
    type: {
      type: String,
      required: true,
      enum: ['Medication', 'Appointment', 'Activity', 'Other'],
      default: 'Other',
    },
    // Store time as "HH:MM" (e.g., "08:00", "21:30") for easy scheduling
    time: {
      type: String,
      required: [true, 'Please specify a time'],
      match: [/^([01]\d|2[0-3]):([0-5]\d)$/, 'Please use 24-hour HH:MM format'],
    },
    isCompleted: {
      type: Boolean,
      default: false,
    },
  },
  {
    timestamps: true,
  }
);

module.exports = mongoose.model('Reminder', reminderSchema);