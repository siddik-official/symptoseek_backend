const mongoose = require('mongoose');

const NotificationSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.ObjectId,
    ref: 'User',
    required: true,
  },
  type: {
    type: String,
    enum: ['medicine', 'exercise', 'appointment'],
    required: true,
  },
  title: {
    type: String,
    required: [true, 'Please add a title'],
    trim: true,
    maxlength: [50, 'Title cannot be more than 50 characters'],
  },
  description: {
    type: String,
    required: [true, 'Please add a description'],
    maxlength: [500, 'Description cannot be more than 500 characters'],
  },
  scheduleTime: {
    type: Date,
    required: [true, 'Please add a schedule time'],
  },
  isRecurring: {
    type: Boolean,
    default: false,
  },
  recurrencePattern: {
    type: String,
    enum: ['daily', 'weekly', 'monthly', null],
    default: null,
  },
  advanceNotice: {
    type: Boolean,
    default: true,
  },
  advanceNoticeMinutes: {
    type: Number,
    default: 60, // Default to 1 hour advance notice
    min: 1,
    max: 1440, // Max 24 hours advance notice
  },
  isCompleted: {
    type: Boolean,
    default: false,
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
});

module.exports = mongoose.model('Notification', NotificationSchema);