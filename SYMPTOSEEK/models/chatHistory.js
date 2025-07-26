const mongoose = require('mongoose');

// Chat Message Schema
const messageSchema = new mongoose.Schema({
    role: {
        type: String,
        required: true,
        enum: ['user', 'bot']
    },
    content: {
        type: String,
        required: true
    },
    timestamp: {
        type: Date,
        default: Date.now
    },
    message_type: {
        type: String,
        enum: ['text', 'diagnosis', 'map'],
        default: 'text'
    }
});

// Chat Conversation Schema
const chatHistorySchema = new mongoose.Schema({
    user_id: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true,
        index: true
    },
    chat_id: {
        type: String,
        required: true,
        unique: true,
        index: true
    },
    title: {
        type: String,
        default: 'New Chat',
        maxlength: 100
    },
    messages: [messageSchema],
    created_at: {
        type: Date,
        default: Date.now,
        index: true
    },
    last_updated: {
        type: Date,
        default: Date.now
    },
    is_active: {
        type: Boolean,
        default: true
    }
});

// Auto-update last_updated field on save
chatHistorySchema.pre('save', function(next) {
    this.last_updated = new Date();
    next();
});

// Create compound index for efficient queries
chatHistorySchema.index({ user_id: 1, created_at: -1 });

// Auto-delete chats older than 3 days (TTL index)
chatHistorySchema.index({ created_at: 1 }, { expireAfterSeconds: 259200 }); // 3 days = 259200 seconds

module.exports = mongoose.model('ChatHistory', chatHistorySchema);
