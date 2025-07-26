// routes/chatHistory.js
const express = require('express');
const router = express.Router();
const ChatHistory = require('../models/chatHistory');
const authMiddleware = require("../middleware/authMiddleware");
const { v4: uuidv4 } = require('uuid');

// GET /api/chat/history - Get all chat conversations for a user
router.get('/history', authMiddleware, async (req, res) => {
    try {
        const userId = req.user.id || req.user._id;
        
        const conversations = await ChatHistory.find({ 
            user_id: userId,
            is_active: true 
        })
        .select('chat_id title created_at last_updated messages')
        .sort({ last_updated: -1 })
        .limit(50) // Limit to last 50 conversations
        .lean();

        // Format response to match frontend expectations
        const formattedConversations = conversations.map(conv => ({
            chat_id: conv.chat_id,
            title: conv.title,
            created_at: conv.created_at,
            last_updated: conv.last_updated,
            message_count: conv.messages.length,
            last_message: conv.messages.length > 0 ? 
                conv.messages[conv.messages.length - 1].content.substring(0, 100) + '...' : 
                'No messages'
        }));

        res.status(200).json({
            success: true,
            conversations: formattedConversations
        });

    } catch (error) {
        console.error('Error fetching chat history:', error);
        res.status(500).json({
            success: false,
            message: 'Error fetching chat history'
        });
    }
});

// POST /api/chat/new - Create a new chat conversation
router.post('/new', authMiddleware, async (req, res) => {
    try {
        const userId = req.user.id || req.user._id;
        const chatId = uuidv4();

        const newChat = new ChatHistory({
            user_id: userId,
            chat_id: chatId,
            title: 'New Chat',
            messages: []
        });

        await newChat.save();

        res.status(201).json({
            success: true,
            chat_id: chatId,
            message: 'New chat created successfully'
        });

    } catch (error) {
        console.error('Error creating new chat:', error);
        res.status(500).json({
            success: false,
            message: 'Error creating new chat'
        });
    }
});

// GET /api/chat/:chatId/messages - Get messages for a specific chat
router.get('/:chatId/messages', authMiddleware, async (req, res) => {
    try {
        const userId = req.user.id || req.user._id;
        const { chatId } = req.params;

        const chat = await ChatHistory.findOne({ 
            chat_id: chatId, 
            user_id: userId,
            is_active: true 
        }).lean();

        if (!chat) {
            return res.status(404).json({
                success: false,
                message: 'Chat not found'
            });
        }

        res.status(200).json({
            success: true,
            chat_id: chatId,
            title: chat.title,
            messages: chat.messages
        });

    } catch (error) {
        console.error('Error fetching chat messages:', error);
        res.status(500).json({
            success: false,
            message: 'Error fetching chat messages'
        });
    }
});

// DELETE /api/chat/:chatId - Delete a specific chat
router.delete('/:chatId', authMiddleware, async (req, res) => {
    try {
        const userId = req.user.id || req.user._id;
        const { chatId } = req.params;

        const result = await ChatHistory.findOneAndUpdate(
            { chat_id: chatId, user_id: userId },
            { is_active: false },
            { new: true }
        );

        if (!result) {
            return res.status(404).json({
                success: false,
                message: 'Chat not found'
            });
        }

        res.status(200).json({
            success: true,
            message: 'Chat deleted successfully'
        });

    } catch (error) {
        console.error('Error deleting chat:', error);
        res.status(500).json({
            success: false,
            message: 'Error deleting chat'
        });
    }
});

// POST /api/chat/:chatId/message - Add a message to existing chat
router.post('/:chatId/message', authMiddleware, async (req, res) => {
    try {
        const userId = req.user.id || req.user._id;
        const { chatId } = req.params;
        const { role, content, message_type = 'text' } = req.body;

        if (!role || !content) {
            return res.status(400).json({
                success: false,
                message: 'Role and content are required'
            });
        }

        const chat = await ChatHistory.findOne({ 
            chat_id: chatId, 
            user_id: userId,
            is_active: true 
        });

        if (!chat) {
            return res.status(404).json({
                success: false,
                message: 'Chat not found'
            });
        }

        // Add new message
        chat.messages.push({
            role,
            content,
            message_type,
            timestamp: new Date()
        });

        // Update title if it's the first user message
        if (chat.title === 'New Chat' && role === 'user' && chat.messages.length <= 2) {
            // Generate title from first user message (first 50 characters)
            chat.title = content.length > 50 ? content.substring(0, 47) + '...' : content;
        }

        await chat.save();

        res.status(200).json({
            success: true,
            message: 'Message added successfully'
        });

    } catch (error) {
        console.error('Error adding message:', error);
        res.status(500).json({
            success: false,
            message: 'Error adding message'
        });
    }
});

module.exports = router;
