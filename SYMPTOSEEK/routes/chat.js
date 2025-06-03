// routes/chat.js
const express = require('express');
const router = express.Router();
const axios = require('axios');
// const jwt = require("jsonwebtoken"); // jwt is likely used in authMiddleware, not directly here
const authMiddleware = require("../middleware/authMiddleware");
const User = require('../models/user'); // Adjust path to your User model

// Environment variable for Flask API URL
const FLASK_API_URL = process.env.FLASK_API_URL || 'http://localhost:5002/chat_api';

// POST /api/chat/
// Protected route, requires authentication
router.post('/', authMiddleware, async (req, res) => {
    try {
        const userMessage = req.body.message;
        const userIdFromToken = req.user.id || req.user._id; // From authMiddleware

        if (!userMessage) {
            return res.status(400).json({ success: false, message: 'Message is required.' });
        }
        if (!userIdFromToken) {
            console.error('Chat Route Error: User ID not found in req.user after auth middleware.');
            return res.status(401).json({ success: false, message: 'User authentication issue. No user ID found.' });
        }

        // Fetch user details from MongoDB
        let userDetails = {};
        try {
            const user = await User.findById(userIdFromToken).select('username name age gender'); // Adjust fields as per your User model
            if (user) {
                userDetails.user_name = user.username || user.name; // Prefer 'username', fallback to 'name'
                userDetails.age = user.age;
                userDetails.gender = user.gender;

                // Validate that essential details are present; otherwise, Flask might have issues
                if (!userDetails.user_name) {
                    console.warn(`User ${userIdFromToken} missing 'username/name' in DB.`);
                    // Decide if this is a critical error or if Flask should handle it
                }
                if (userDetails.age === undefined || userDetails.age === null) {
                    console.warn(`User ${userIdFromToken} missing 'age' in DB.`);
                    // Flask will have to ask or error if prediction needs it and it's not provided
                }
                if (!userDetails.gender) {
                    console.warn(`User ${userIdFromToken} missing 'gender' in DB.`);
                }

            } else {
                console.error(`Chat Route Error: User with ID ${userIdFromToken} not found in database.`);
                return res.status(404).json({ success: false, message: 'User not found.' });
            }
        } catch (dbError) {
            console.error('Chat Route Error: Error fetching user details from DB:', dbError);
            return res.status(500).json({ success: false, message: 'Error fetching user data.' });
        }
        
        console.log(`Node CHAT ROUTE: User ${userIdFromToken} (${userDetails.user_name || 'N/A'}), Age: ${userDetails.age}, Gender: ${userDetails.gender}. Msg: "${userMessage}"`);

        // Call the Flask microservice
        const flaskPayload = {
            message: userMessage,
            user_id: userIdFromToken,
            ...userDetails // Spread user_name, age, gender
        };

        const flaskResponse = await axios.post(FLASK_API_URL, flaskPayload);
        
        console.log(`Node CHAT ROUTE: Flask responded for user ${userIdFromToken}. Parts: ${flaskResponse.data.bot_response_parts.length}`);
        if (flaskResponse.data.map_data) {
            console.log(`Node CHAT ROUTE: Flask included map_data for user ${userIdFromToken}`);
        }

        res.status(200).json({ success: true, ...flaskResponse.data });

    } catch (error) {
        console.error('Error in /api/chat route:', error.message);
        if (error.response) { // Error from Flask app
            console.error('Flask Error Data:', error.response.data);
            console.error('Flask Error Status:', error.response.status);
            res.status(error.response.status || 500).json({ 
                success: false,
                message: 'Error communicating with the symptom analysis service.',
                error_details: error.message,
                flask_response: error.response.data 
            });
        } else if (error.request) { // Request made but no response from Flask
             console.error('No response from Flask:', error.request);
             res.status(503).json({ success: false, message: 'Symptom analysis service is unavailable (no response).' });
        } else { // Other errors
            res.status(500).json({ success: false, message: 'Internal server error in chat processing.' });
        }
    }
});

module.exports = router;