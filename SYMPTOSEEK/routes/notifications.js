const express = require('express');
const router = express.Router();
const Notification = require('../models/notifications');
const authMiddleware = require("../middleware/authMiddleware");
const cron = require('node-cron');
const { sendReminderEmail } = require('../services/emailService');

// Schedule notification checks every minute
cron.schedule('* * * * *', async () => {
  try {
    const now = new Date();
    const nextMinute = new Date(now.getTime() + 60000);

    // Find notifications due for advance notice or main notification
    const notifications = await Notification.find({
      $or: [
        {
          // Check for advance notifications (15 minutes before by default)
          scheduleTime: {
            $gte: new Date(now.getTime() + (14 * 60 * 1000)), // 14 minutes from now
            $lte: new Date(now.getTime() + (16 * 60 * 1000))  // 16 minutes from now
          },
          isCompleted: false,
          advanceNotice: true
        },
        {
          // Check for main notifications (at scheduled time)
          scheduleTime: {
            $gte: now,
            $lte: nextMinute
          },
          isCompleted: false
        }
      ]
    }).populate('user');

    for (const notification of notifications) {
      await sendNotification(notification);
      
      // Mark as completed if not recurring and it's the main notification time
      const isMainNotification = new Date(notification.scheduleTime) <= new Date();
      if (!notification.isRecurring && isMainNotification) {
        notification.isCompleted = true;
        await notification.save();
      } else if (notification.isRecurring && isMainNotification) {
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
  const { type, title, description, scheduleTime, isRecurring, recurrencePattern, advanceNoticeMinutes } = req.body;
  
  // Basic validation
  if (!type || !title || !scheduleTime) {
    return res.status(400).json({ message: "Type, title and schedule time are required" });
  }

  // Check if time is in the future
  if (new Date(scheduleTime) < new Date()) {
    return res.status(400).json({ message: "Schedule time must be in the future" });
  }

  try {
    const notification = new Notification({
      user: req.user.id,
      type,
      title,
      description,
      scheduleTime,
      isRecurring: isRecurring || false,
      recurrencePattern: isRecurring ? recurrencePattern : null,
      advanceNoticeMinutes: advanceNoticeMinutes || 15, // Default to 15 minutes
      advanceNotice: true
    });

    const savedNotification = await notification.save();
    res.status(201).json(savedNotification);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// Get notifications with unread count
router.get('/unread-count', authMiddleware, async (req, res) => {
  try {
    const unreadCount = await Notification.countDocuments({ 
      user: req.user.id,
      isCompleted: false,
      scheduleTime: { $lte: new Date() }
    });

    res.json({ unreadCount });
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
    }
    if (req.body.isRecurring !== undefined) notification.isRecurring = req.body.isRecurring;
    if (req.body.recurrencePattern) notification.recurrencePattern = req.body.recurrencePattern;
    if (req.body.advanceNoticeMinutes) notification.advanceNoticeMinutes = req.body.advanceNoticeMinutes;

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

// Mark notification as read/completed
router.patch('/:id/read', authMiddleware, async (req, res) => {
  try {
    const notification = await Notification.findOne({
      _id: req.params.id,
      user: req.user.id
    });

    if (!notification) {
      return res.status(404).json({ message: "Notification not found" });
    }

    notification.isCompleted = true;
    await notification.save();

    res.json({ message: "Notification marked as read" });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// Helper functions
async function sendNotification(notification) {
  try {
    const now = new Date();
    const notificationTime = new Date(notification.scheduleTime);
    const advanceMinutes = notification.advanceNoticeMinutes || 15;
    const advanceTime = new Date(notificationTime.getTime() - (advanceMinutes * 60 * 1000));
    
    const isAdvanceNotice = now >= advanceTime && now < notificationTime;
    const isMainNotification = now >= notificationTime;

    if (!isAdvanceNotice && !isMainNotification) {
      return; // Not time yet
    }

    let subject, timeMessage;
    
    if (isAdvanceNotice) {
      subject = `⏰ Upcoming Reminder: ${notification.title}`;
      timeMessage = `in ${advanceMinutes} minutes at ${notificationTime.toLocaleTimeString()}`;
    } else {
      subject = `🔔 Reminder: ${notification.title}`;
      timeMessage = "now";
    }

    const reminderData = {
      title: notification.title,
      description: notification.description,
      time: timeMessage,
      type: notification.type,
      scheduledTime: notificationTime.toLocaleString()
    };

    await sendReminderEmail(notification.user.email, reminderData);
    console.log(`Notification sent for ${notification.title} to ${notification.user.email}`);
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
    notification.isCompleted = false;
    await notification.save();
  } catch (err) {
    console.error('Error updating recurring notification:', err);
  }
}

module.exports = router;