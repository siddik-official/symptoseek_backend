// routes/chat.js
const express = require('express');
const router = express.Router();
const axios = require('axios');
const authMiddleware = require("../middleware/authMiddleware");
const User = require('../models/user');
const ChatHistory = require('../models/chatHistory');
const { v4: uuidv4 } = require('uuid');

// Environment variable for Flask API URL
const FLASK_API_URL = process.env.FLASK_API_URL || 'http://localhost:5001/chat';

// POST /api/chat/ -- Intelligent Chatbot Route
router.post('/', authMiddleware, async (req, res) => {
    try {
        const userMessage = req.body.message;
        const userIdFromToken = req.user.id || req.user._id;
        const chatId = req.body.chat_id || uuidv4(); // Use provided chat_id or create new one

        if (!userMessage) {
            return res.status(400).json({ success: false, message: 'Message is required.' });
        }
        if (!userIdFromToken) {
            console.error('User ID missing in authentication middleware.');
            return res.status(401).json({ success: false, message: 'User authentication failed.' });
        }

        // Fetch user profile info
        let userDetails = {};
        try {
            const user = await User.findById(userIdFromToken).select('username name age gender');
            if (user) {
                userDetails.user_name = user.username || user.name;
                userDetails.age = user.age;
                userDetails.gender = user.gender;
            } else {
                return res.status(404).json({ success: false, message: 'User not found.' });
            }
        } catch (err) {
            console.error('Error fetching user details:', err);
            return res.status(500).json({ success: false, message: 'Error fetching user data.' });
        }

        // Extract latitude and longitude from frontend request
        const userLatitude = req.body.latitude;
        const userLongitude = req.body.longitude;

        if (!userLatitude || !userLongitude) {
            console.warn('Location not provided, using default Dhaka coordinates');
        }

        // Build payload for Flask
        const flaskPayload = {
            message: userMessage,
            user_id: userIdFromToken,
            user_name: userDetails.user_name,
            age: userDetails.age,
            gender: userDetails.gender,
            latitude: userLatitude || 23.8103,
            longitude: userLongitude || 90.4125,
            chat_id: chatId
        };

        // Save user message to database first
        await saveMessageToChat(userIdFromToken, chatId, 'user', userMessage);

        const flaskResponse = await axios.post(FLASK_API_URL, flaskPayload);

        // Extract bot response content for database storage
        let botResponseContent = '';
        let messageType = 'text';

        if (flaskResponse.data.bot_response_parts) {
            // Extract text content from bot response parts
            const textParts = flaskResponse.data.bot_response_parts
                .filter(part => part.type === 'text')
                .map(part => part.content);
            botResponseContent = textParts.join(' ');
            
            // Check if response contains diagnosis or map
            if (flaskResponse.data.bot_response_parts.some(part => part.type === 'diagnosis')) {
                messageType = 'diagnosis';
            } else if (flaskResponse.data.map_data) {
                messageType = 'map';
            }
        } else if (flaskResponse.data.predicted_disease) {
            botResponseContent = `Predicted condition: ${flaskResponse.data.predicted_disease}`;
            messageType = 'diagnosis';
        } else {
            botResponseContent = flaskResponse.data.message || flaskResponse.data.response || "I'm here to help with your health concerns.";
        }

        // Save bot response to database
        await saveMessageToChat(userIdFromToken, chatId, 'bot', botResponseContent, messageType);

        // Determine which type of response Flask returned
        if (flaskResponse.data.bot_response_parts) {
            res.status(200).json({
                success: true,
                chat_id: chatId,
                bot_response_parts: flaskResponse.data.bot_response_parts,
                map_data: flaskResponse.data.map_data || null
            });
        } else if (flaskResponse.data.predicted_disease) {
            res.status(200).json({
                success: true,
                chat_id: chatId,
                ...flaskResponse.data
            });
        } else {
            // Fallback for simple message responses
            res.status(200).json({ 
                success: true,
                chat_id: chatId,
                bot_response_parts: [
                    {
                        type: 'text',
                        content: flaskResponse.data.message || flaskResponse.data.response || "I'm here to help with your health concerns."
                    }
                ]
            });
        }

    } catch (error) {
        console.error('Error in /api/chat route:', error.message);
        if (error.response) {
            console.error('Flask Error:', error.response.data);
            res.status(error.response.status || 500).json({ 
                success: false,
                message: 'Error communicating with AI symptom analysis service.',
                flask_error: error.response.data 
            });
        } else {
            res.status(500).json({ success: false, message: 'Internal server error.' });
        }
    }
});

// Helper function to save messages to chat history
async function saveMessageToChat(userId, chatId, role, content, messageType = 'text') {
    try {
        // Find existing chat or create new one
        let chat = await ChatHistory.findOne({ 
            chat_id: chatId, 
            user_id: userId,
            is_active: true 
        });

        if (!chat) {
            // Create new chat if it doesn't exist
            chat = new ChatHistory({
                user_id: userId,
                chat_id: chatId,
                title: 'New Chat',
                messages: []
            });
        }

        // Add new message
        chat.messages.push({
            role,
            content,
            message_type: messageType,
            timestamp: new Date()
        });

        // Update title if it's the first user message
        if (chat.title === 'New Chat' && role === 'user' && chat.messages.length <= 2) {
            // Generate title from first user message (first 50 characters)
            chat.title = content.length > 50 ? content.substring(0, 47) + '...' : content;
        }

        await chat.save();
        return true;
    } catch (error) {
        console.error('Error saving message to chat:', error);
        return false;
    }
}

module.exports = router;
