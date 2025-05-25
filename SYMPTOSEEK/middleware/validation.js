const { body, validationResult } = require('express-validator');

exports.validateSymptoms = [
    body('symptoms')
        .isArray({ min: 1 })
        .withMessage('At least one symptom is required'),
    body('symptoms.*')
        .isString()
        .trim()
        .notEmpty()
        .withMessage('Symptoms must be non-empty strings'),
    (req, res, next) => {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({ errors: errors.array() });
        }
        next();
    }
];