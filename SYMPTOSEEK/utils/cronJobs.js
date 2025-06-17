// utils/cronJobs.js
const cron = require('node-cron');
const cloudinary = require('cloudinary').v2;
const Report = require('../models/reports');
const User = require('../models/user');

const cleanupOldReports = async () => {
    console.log('Running cron job: Cleaning up old reports...');
    try {
        const fifteenDaysAgo = new Date(Date.now() - 15 * 24 * 60 * 60 * 1000);

        // Find reports older than 15 days
        const oldReports = await Report.find({ createdAt: { $lte: fifteenDaysAgo } }).populate('user');

        if (oldReports.length === 0) {
            console.log('No old reports to delete.');
            return;
        }

        console.log(`Found ${oldReports.length} reports to delete.`);

        // Group reports by user to update storage in batches
        const userStorageUpdates = {};

        for (const report of oldReports) {
            // Delete from Cloudinary
            await cloudinary.uploader.destroy(report.filePublicId);

            // Aggregate storage to be deducted per user
            const userId = report.user._id.toString();
            if (!userStorageUpdates[userId]) {
                userStorageUpdates[userId] = 0;
            }
            userStorageUpdates[userId] += report.fileSize;
        }
        
        // Update user storage
        for (const userId in userStorageUpdates) {
            await User.findByIdAndUpdate(userId, { $inc: { storageUsed: -userStorageUpdates[userId] } });
        }

        // Delete reports from DB
        const reportIdsToDelete = oldReports.map(r => r._id);
        await Report.deleteMany({ _id: { $in: reportIdsToDelete } });

        console.log(`Successfully deleted ${oldReports.length} old reports.`);

    } catch (error) {
        console.error('Error during old reports cleanup:', error);
    }
};

// Schedule to run once a day at midnight
const scheduleReportCleanup = () => {
    cron.schedule('0 0 * * *', cleanupOldReports);
    console.log('Scheduled daily cleanup of old reports.');
};

module.exports = { scheduleReportCleanup };