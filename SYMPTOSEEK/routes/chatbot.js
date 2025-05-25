const express = require('express');
const axios = require('axios');
const Doctor = require('../models/doctor.model');
const { validateSymptoms } = require('../middleware/validation');

const router = express.Router();

/**
 * @route POST /api/chat/predict
 * @desc Predict disease from symptoms and recommend doctors
 * @access Private
 */
router.post('/predict', validateSymptoms, async (req, res) => {
    try {
        const { symptoms } = req.body;
        
        // 1. Call ML Service
        const mlResponse = await axios.post('http://localhost:5001/predict', {
            symptoms: symptoms.map(s => s.toLowerCase().trim())
        });
        
        // 2. Find matching doctors
        const doctors = await Doctor.find({
            specialization: mlResponse.data.category
        })
        .select('name specialization contact hospital rating')
        .sort({ rating: -1 })
        .limit(3);
        
        // 3. Format response
        const response = {
            diagnosis: {
                disease: mlResponse.data.predicted_disease,
                confidence: mlResponse.data.confidence,
                category: mlResponse.data.category
            },
            symptoms: {
                provided: symptoms,
                related: mlResponse.data.related_symptoms
            },
            recommended_doctors: doctors.map(doc => ({
                id: doc._id,
                name: doc.name,
                specialization: doc.specialization,
                contact: doc.contact,
                hospital: doc.hospital,
                rating: doc.rating
            }))
        };
        
        res.json(response);
        
    } catch (error) {
        console.error('Prediction error:', error);
        
        // Enhanced error handling
        const status = error.response?.status || 500;
        const message = status === 500 
            ? 'Diagnosis service unavailable' 
            : error.response?.data?.error || 'Prediction failed';
            
        res.status(status).json({ 
            error: message,
            details: process.env.NODE_ENV === 'development' ? error.message : undefined
        });
    }
});

module.exports = router;