const cron = require('node-cron');
const Reminder = require('../models/reminders');
const User = require('../models/user'); 
const { sendReminderEmail } = require('./emailService');

// This map will hold all active cron jobs, with the reminder ID as the key.
const scheduledJobs = new Map();

/**
 * Schedules a new reminder notification.
 * @param {object} reminder - The Mongoose reminder document.
 */
const scheduleReminder = async (reminder) => {
  if (!reminder || !reminder._id) return;

  const reminderId = reminder._id.toString();

  // If a job for this reminder already exists, stop it before creating a new one.
  if (scheduledJobs.has(reminderId)) {
    cancelReminder(reminderId);
  }

  const [hour, minute] = reminder.time.split(':');
  // Cron pattern: 'minute hour * * *' (runs every day at this time)
  const cronExpression = `${minute} ${hour} * * *`;

  const job = cron.schedule(cronExpression, async () => {
    try {
      // Find the latest version of the reminder and its user
      const currentReminder = await Reminder.findById(reminderId);
      if (!currentReminder) {
         cancelReminder(reminderId); // Reminder was deleted, so cancel job.
         return;
      }
      
      // Only send if it hasn't been marked complete today
      if (currentReminder.isCompleted) {
        console.log(`Skipping notification for completed reminder: "${currentReminder.title}"`);
        return;
      }
      
      const user = await User.findById(currentReminder.user);
      if (user && user.email) {
        await sendReminderEmail(user.email, currentReminder);
      }
    } catch (error) {
      console.error(`Error processing job for reminder ${reminderId}:`, error);
    }
  }, {
    // You can make this dynamic based on user settings in the future
    timezone: "Asia/Dhaka" 
  });

  scheduledJobs.set(reminderId, job);
  console.log(`Scheduled: "${reminder.title}" for ${reminder.time} (Asia/Dhaka time) daily. Job ID: ${reminderId}`);
};

/**
 * Cancels a scheduled reminder notification.
 * @param {string} reminderId - The ID of the reminder's job to cancel.
 */
const cancelReminder = (reminderId) => {
  const job = scheduledJobs.get(reminderId);
  if (job) {
    job.stop();
    scheduledJobs.delete(reminderId);
    console.log(`Cancelled job for reminder ID: ${reminderId}`);
  }
};

/**
 * Loads all active reminders from the DB on server start and schedules them.
 */
const initializeSchedules = async () => {
    console.log('Initializing reminder schedules from database...');
    try {
        const reminders = await Reminder.find({}); // Get all reminders
        for (const reminder of reminders) {
            await scheduleReminder(reminder);
        }
        console.log(`Successfully initialized ${reminders.length} reminder schedules.`);
    } catch (error) {
        console.error('Failed to initialize schedules:', error);
    }
};

module.exports = {
  scheduleReminder,
  cancelReminder,
  initializeSchedules,
};