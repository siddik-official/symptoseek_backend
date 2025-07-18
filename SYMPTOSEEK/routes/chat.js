// routes/chat.js
const express = require('express');
const router = express.Router();
const axios = require('axios');
const authMiddleware = require("../middleware/authMiddleware");
const User = require('../models/user');

// Environment variable for Flask API URL
const FLASK_API_URL = process.env.FLASK_API_URL || 'http://localhost:5001/chat_api';

// POST /api/chat/ -- Intelligent Chatbot Route
router.post('/', authMiddleware, async (req, res) => {
    try {
        const userMessage = req.body.message;
        const userIdFromToken = req.user.id || req.user._id;

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
            longitude: userLongitude || 90.4125
        };

        const flaskResponse = await axios.post(FLASK_API_URL, flaskPayload);

        // Determine which type of response Flask returned
        if (flaskResponse.data.bot_response_parts) {
            res.status(200).json({
                success: true,
                bot_response_parts: flaskResponse.data.bot_response_parts
            });
        } else if (flaskResponse.data.predicted_disease) {
            res.status(200).json({
                success: true,
                ...flaskResponse.data
            });
        } else {
            res.status(200).json({ success: true, message: "Flask returned unexpected format." });
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

module.exports = router;
