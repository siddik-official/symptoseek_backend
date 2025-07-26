const express = require('express');
const router = express.Router();
const Reminder = require('../models/reminders');
const { scheduleReminder, cancelReminder } = require('../services/schedulerService');
const authMiddleware = require('../middleware/authMiddleware');

// @desc    Get all reminders for the logged-in user
// @route   GET /api/reminders
// @access  Private
router.get('/', authMiddleware, async (req, res) => {
  try {
    const reminders = await Reminder.find({ user: req.user.id }).sort({ time: 'asc' });
    res.status(200).json(reminders);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server Error' });
  }
});

// @desc    Add a new reminder
// @route   POST /api/reminders
// @access  Private
router.post('/', authMiddleware, async (req, res) => {
  try {
    const { title, description, type, time, date, recurring, daysOfWeek } = req.body;

    if (!title || !type || !time) {
      return res.status(400).json({ message: 'Title, type, and time are required' });
    }

    const reminderData = {
      user: req.user.id,
      title,
      description,
      type,
      time,
    };

    // Add optional fields if provided
    if (date) reminderData.date = date;
    if (recurring) reminderData.recurring = recurring;
    if (daysOfWeek && Array.isArray(daysOfWeek)) reminderData.daysOfWeek = daysOfWeek;

    const reminder = await Reminder.create(reminderData);

    await scheduleReminder(reminder);
    res.status(201).json(reminder);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server Error' });
  }
});

// @desc    Update a reminder
// @route   PUT /api/reminders/:id
// @access  Private
router.put('/:id', authMiddleware, async (req, res) => {
  try {
    let reminder = await Reminder.findById(req.params.id);

    if (!reminder) {
      return res.status(404).json({ message: 'Reminder not found' });
    }

    if (reminder.user.toString() !== req.user.id) {
      return res.status(401).json({ message: 'Not authorized' });
    }

    const originalTime = reminder.time;
    const updatedReminder = await Reminder.findByIdAndUpdate(req.params.id, req.body, { new: true });

    if (req.body.time && req.body.time !== originalTime) {
      await scheduleReminder(updatedReminder);
    }

    res.status(200).json(updatedReminder);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server Error' });
  }
});

// @desc    Delete a reminder
// @route   DELETE /api/reminders/:id
// @access  Private
router.delete('/:id', authMiddleware, async (req, res) => {
  try {
    const reminder = await Reminder.findById(req.params.id);

    if (!reminder) {
      return res.status(404).json({ message: 'Reminder not found' });
    }

    if (reminder.user.toString() !== req.user.id) {
      return res.status(401).json({ message: 'Not authorized' });
    }

    cancelReminder(reminder._id.toString());
    await reminder.remove();

    res.status(200).json({ id: req.params.id, message: 'Reminder removed' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server Error' });
  }
});

module.exports = router;
