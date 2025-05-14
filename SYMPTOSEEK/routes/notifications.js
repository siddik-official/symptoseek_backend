const express = require('express');
const router = express.Router();
const Notification = require('../models/notification');
const authMiddleware = require("../middleware/authMiddleware");
const cron = require('node-cron');
const { sendEmail } = require('../utils/emailService');

// Schedule notification checks every minute
cron.schedule('* * * * *', async () => {
  try {
    const now = new Date();
    const nextMinute = new Date(now.getTime() + 60000);

    // Find notifications due in the next minute or with advance notices
    const notifications = await Notification.find({
      $or: [
        {
          scheduleTime: {
            $gte: now,
            $lte: nextMinute
          },
          isCompleted: false
        },
        {
          advanceNoticeTime: {
            $gte: now,
            $lte: nextMinute
          },
          isCompleted: false
        }
      ]
    }).populate('user');

    for (const notification of notifications) {
      await sendNotification(notification);
      
      // Mark as completed if not recurring
      if (!notification.isRecurring) {
        notification.isCompleted = true;
        await notification.save();
      } else {
        // Update next occurrence for recurring notifications
        updateRecurringNotification(notification);
      }
    }
  } catch (err) {
    console.error('Notification scheduler error:', err);
  }
});

// Create new notification
router.post('/', authMiddleware, async (req, res) => {
  const { type, title, description, scheduleTime, isRecurring, recurrencePattern } = req.body;
  
  // Basic validation
  if (!type || !title || !scheduleTime) {
    return res.status(400).json({ message: "Type, title and schedule time are required" });
  }

  // Check if time is in the future
  if (new Date(scheduleTime) < new Date()) {
    return res.status(400).json({ message: "Schedule time must be in the future" });
  }

  try {
    // Calculate advance notice time (1 hour before by default)
    const advanceNoticeTime = new Date(new Date(scheduleTime).getTime() - (60 * 60 * 1000));

    const notification = new Notification({
      user: req.user.id,
      type,
      title,
      description,
      scheduleTime,
      isRecurring: isRecurring || false,
      recurrencePattern: isRecurring ? recurrencePattern : null,
      advanceNoticeTime
    });

    const savedNotification = await notification.save();
    res.status(201).json(savedNotification);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// Get all notifications for current user
router.get('/', authMiddleware, async (req, res) => {
  try {
    const notifications = await Notification.find({ user: req.user.id })
      .sort({ scheduleTime: 1 });

    res.json(notifications);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// Get single notification
router.get('/:id', authMiddleware, async (req, res) => {
  try {
    const notification = await Notification.findOne({
      _id: req.params.id,
      user: req.user.id
    });

    if (!notification) {
      return res.status(404).json({ message: "Notification not found" });
    }

    res.json(notification);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// Update notification
router.put('/:id', authMiddleware, async (req, res) => {
  try {
    const notification = await Notification.findOne({
      _id: req.params.id,
      user: req.user.id
    });

    if (!notification) {
      return res.status(404).json({ message: "Notification not found" });
    }

    // Update fields
    if (req.body.title) notification.title = req.body.title;
    if (req.body.description) notification.description = req.body.description;
    if (req.body.scheduleTime) {
      notification.scheduleTime = req.body.scheduleTime;
      // Recalculate advance notice time
      notification.advanceNoticeTime = new Date(new Date(req.body.scheduleTime).getTime() - (60 * 60 * 1000));
    }
    if (req.body.isRecurring !== undefined) notification.isRecurring = req.body.isRecurring;
    if (req.body.recurrencePattern) notification.recurrencePattern = req.body.recurrencePattern;

    const updatedNotification = await notification.save();
    res.json(updatedNotification);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// Delete notification
router.delete('/:id', authMiddleware, async (req, res) => {
  try {
    const notification = await Notification.findOneAndDelete({
      _id: req.params.id,
      user: req.user.id
    });

    if (!notification) {
      return res.status(404).json({ message: "Notification not found" });
    }

    res.json({ message: "Notification deleted successfully" });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// Helper functions
async function sendNotification(notification) {
  try {
    const isAdvanceNotice = notification.advanceNoticeTime && 
      new Date(notification.advanceNoticeTime) <= new Date() && 
      new Date() < new Date(notification.scheduleTime);

    const subject = isAdvanceNotice ? 
      `Upcoming: ${notification.title}` : 
      `Reminder: ${notification.title}`;
    
    const timeMessage = isAdvanceNotice ? 
      `scheduled for ${notification.scheduleTime}` : 
      "happening now";

    const message = `Hello,\n\nThis is a reminder about your ${notification.type}:\n\n` +
      `${notification.description}\n\n` +
      `This event is ${timeMessage}.\n\n` +
      `Thank you!`;

    await sendEmail(notification.user.email, subject, message);
    console.log(`Notification sent for ${notification.title}`);
  } catch (err) {
    console.error('Error sending notification:', err);
  }
}

async function updateRecurringNotification(notification) {
  try {
    let nextDate;
    const currentDate = notification.scheduleTime;

    switch (notification.recurrencePattern) {
      case 'daily':
        nextDate = new Date(currentDate.getTime() + 24 * 60 * 60 * 1000);
        break;
      case 'weekly':
        nextDate = new Date(currentDate.getTime() + 7 * 24 * 60 * 60 * 1000);
        break;
      case 'monthly':
        nextDate = new Date(currentDate);
        nextDate.setMonth(nextDate.getMonth() + 1);
        break;
      default:
        return;
    }

    notification.scheduleTime = nextDate;
    notification.advanceNoticeTime = new Date(nextDate.getTime() - (60 * 60 * 1000));
    notification.isCompleted = false;
    await notification.save();
  } catch (err) {
    console.error('Error updating recurring notification:', err);
  }
}

module.exports = router;