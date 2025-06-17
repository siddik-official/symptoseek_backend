const mongoose = require('mongoose');

const ReportSchema = new mongoose.Schema({
    user: {
        type: mongoose.Schema.ObjectId,
        ref: 'user',
        required: true,
    },
    title: {
        type: String,
        required: [true, 'Please add a title'],
        trim: true,
    },
    type: {
        type: String,
        required: [true, 'Please select a report type'],
        enum: ['Check-up', 'Laboratory', 'Radiology', 'Specialist', 'Other'],
    },
    status: {
        type: String,
        required: true,
        enum: ['Completed', 'Processing', 'Pending'],
        default: 'Pending',
    },
    reportDate: {
        type: Date,
        required: [true, 'Please add the date of the report'],
    },
    doctor: {
        type: String,
        trim: true,
    },
    fileUrl: {
        type: String,
        required: true,
    },
    filePublicId: { // Crucial for deleting from Cloudinary
        type: String,
        required: true,
    },
    fileSize: { // Stored in bytes, crucial for tracking storage
        type: Number,
        required: true,
    }
}, { timestamps: true }); // `createdAt` will be used for auto-deletion logic

module.exports = mongoose.model('Report', ReportSchema);