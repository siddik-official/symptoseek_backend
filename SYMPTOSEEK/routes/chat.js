// routes/chat.js
const express = require('express');
const router = express.Router();
const axios = require('axios');
const jwt = require("jsonwebtoken");
const authMiddleware = require("../middleware/authMiddleware");
// Environment variable for Flask API URL

const FLASK_API_URL = process.env.FLASK_API_URL || 'http://localhost:5002/chat_api';

// POST /api/chat/
// Protected route, requires authentication
router.post('/', authMiddleware, async (req, res) => {
    try {
        const userMessage = req.body.message;
        // req.user should be populated by your 'protect' middleware
        // Assuming it contains user's ID, e.g., req.user.id or req.user._id
        const userIdFromToken = req.user.id || req.user._id; // Adjust based on your authMiddleware

        if (!userMessage) {
            return res.status(400).json({ success: false, message: 'Message is required.' });
        }
        if (!userIdFromToken) {
            console.error('Chat Route Error: User ID not found in req.user after auth middleware.');
            return res.status(401).json({ success: false, message: 'User authentication issue. No user ID found.' });
        }

        console.log(`Node CHAT ROUTE: Received message from user ${userIdFromToken} (${req.user.username || 'N/A'}): "${userMessage}"`);

        // Call the Flask microservice
        const flaskResponse = await axios.post(FLASK_API_URL, {
            message: userMessage,
            user_id: userIdFromToken // Pass the authenticated user's ID to Flask
        });
        
        console.log(`Node CHAT ROUTE: Flask responded for user ${userIdFromToken}. Parts: ${flaskResponse.data.bot_response_parts.length}`);
        if (flaskResponse.data.map_data) {
            console.log(`Node CHAT ROUTE: Flask included map_data for user ${userIdFromToken}`);
        }

        // Forward Flask's response to the client
        // Add success: true for consistency if your other routes do this
        res.status(200).json({ success: true, ...flaskResponse.data });

    } catch (error) {
        console.error('Error in /api/chat route:', error.message);
        if (error.response) { // Error from Flask app
            console.error('Flask Error Data:', error.response.data);
            console.error('Flask Error Status:', error.response.status);
            res.status(error.response.status || 500).json({ 
                success: false,
                message: 'Error communicating with the symptom analysis service.',
                error_details: error.message, // General error
                flask_response: error.response.data // Specific data from flask if available
            });
        } else if (error.request) { // Request made but no response from Flask
             console.error('No response from Flask:', error.request);
             res.status(503).json({ success: false, message: 'Symptom analysis service is unavailable (no response).' });
        } else { // Other errors (e.g., code error in this route)
            res.status(500).json({ success: false, message: 'Internal server error in chat processing.' });
        }
    }
});

module.exports = router;