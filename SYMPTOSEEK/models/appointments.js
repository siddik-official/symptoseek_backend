const mongoose = require('mongoose');

const appointmentSchema = new mongoose.Schema({
    doctors_id: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Doctor',
        required: true
    },
    userId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    date: {
        type: Date,
        required: true
    },
    reason: {
        type: String,
        required: false,
        default: "General consultation"
    },
    status: {
        type: String,
        enum: ['Pending', 'Approved', 'Rejected', 'Cancelled', 'Completed'],
        default: 'Pending'
    },
    adminId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: false
    },
    adminNote: {
        type: String,
        required: false
    },
    approvedAt: {
        type: Date,
        required: false
    },
    rejectedAt: {
        type: Date,
        required: false
    },
    cancelledAt: {
        type: Date,
        required: false
    },
    createdAt: {
        type: Date,
        default: Date.now
    },
    updatedAt: {
        type: Date,
        default: Date.now
    }
});

// Update the updatedAt field before saving
appointmentSchema.pre('save', function(next) {
    this.updatedAt = new Date();
    next();
});

module.exports = mongoose.model('Appointment', appointmentSchema);
