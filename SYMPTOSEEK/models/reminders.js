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
      enum: ['medication', 'appointment', 'exercise', 'other'],
      default: 'other',
    },
    // Store time as "HH:MM" (e.g., "08:00", "21:30") for easy scheduling
    time: {
      type: String,
      required: [true, 'Please specify a time'],
      match: [/^([01]\d|2[0-3]):([0-5]\d)$/, 'Please use 24-hour HH:MM format'],
    },
    // Date for one-time reminders or start date for recurring
    date: {
      type: Date,
    },
    // Recurring pattern
    recurring: {
      type: String,
      enum: ['none', 'daily', 'weekly', 'monthly'],
      default: 'none',
    },
    // Days of week for weekly recurring (0-6, Sunday-Saturday)
    daysOfWeek: {
      type: [Number],
      validate: {
        validator: function(v) {
          return v.every(day => day >= 0 && day <= 6);
        },
        message: 'Days of week must be between 0-6 (Sunday-Saturday)'
      }
    },
    isCompleted: {
      type: Boolean,
      default: false,
    },
    // For tracking completion status
    completed: {
      type: Boolean,
      default: false,
    },
  },
  {
    timestamps: true,
  }
);

module.exports = mongoose.model('Reminder', reminderSchema);