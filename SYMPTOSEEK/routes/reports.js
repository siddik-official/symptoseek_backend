// routes/reports.js

const express = require('express');
const router = express.Router();
const authMiddleware = require('../middleware/authMiddleware');
const upload = require('../middleware/upload');
const cloudinary = require('cloudinary').v2;
const Report = require('../models/reports');
const User = require('../models/user');

const MAX_TOTAL_STORAGE = parseInt(process.env.MAX_TOTAL_STORAGE_MB) * 1024 * 1024;

// All routes here are protected
router.use(authMiddleware);

// @desc    Get all reports for the logged-in user
// @route   GET /api/reports
// @access  Private
router.get('/', async (req, res) => {
    try {
        const query = { user: req.user.id };

        if (req.query.status && req.query.status !== 'All Statuses') {
            query.status = req.query.status;
        }
        if (req.query.type && req.query.type !== 'All Types') {
            query.type = req.query.type;
        }

        const reports = await Report.find(query).sort({ reportDate: -1 });
        res.status(200).json({ success: true, count: reports.length, data: reports });
    } catch (err) {
        console.error(err);
        res.status(500).json({ success: false, message: 'Server Error' });
    }
});

// @desc    Add a new report
// @route   POST /api/reports
// @access  Private
router.post('/', upload.single('reportFile'), async (req, res) => {
    try {
        if (!req.file) {
            return res.status(400).json({ success: false, message: 'Please upload a report file (image or PDF).' });
        }

        const newFileSize = req.file.size;
        if ((req.user.storageUsed + newFileSize) > MAX_TOTAL_STORAGE) {
            return res.status(400).json({
                success: false,
                message: `Cannot upload. Storage limit of ${process.env.MAX_TOTAL_STORAGE_MB}MB would be exceeded.`
            });
        }

        const uploadStream = cloudinary.uploader.upload_stream(
            {
                folder: `reports/${req.user.id}`,
                resource_type: 'auto',
            },
            async (error, result) => {
                if (error) {
                    console.error('Cloudinary Upload Error:', error);
                    return res.status(500).json({ success: false, message: 'File upload failed.' });
                }

                const { title, type, status, reportDate, doctor } = req.body;
                const report = await Report.create({
                    user: req.user.id,
                    title,
                    type,
                    status,
                    reportDate,
                    doctor,
                    fileUrl: result.secure_url,
                    filePublicId: result.public_id,
                    fileSize: result.bytes,
                });

                await User.findByIdAndUpdate(req.user.id, { $inc: { storageUsed: result.bytes } });

                res.status(201).json({ success: true, data: report });
            }
        );

        uploadStream.end(req.file.buffer);

    } catch (err) {
        console.error(err);
        res.status(500).json({ success: false, message: 'Server Error' });
    }
});

// @desc    Delete a report
// @route   DELETE /api/reports/:id
// @access  Private
router.delete('/:id', async (req, res) => {
    try {
        const report = await Report.findById(req.params.id);
        if (!report) {
            return res.status(404).json({ success: false, message: 'Report not found' });
        }

        if (report.user.toString() !== req.user.id) {
            return res.status(401).json({ success: false, message: 'Not authorized to access this report' });
        }

        await cloudinary.uploader.destroy(report.filePublicId);
        await User.findByIdAndUpdate(req.user.id, { $inc: { storageUsed: -report.fileSize } });
        await report.deleteOne();

        res.status(200).json({ success: true, message: 'Report deleted successfully' });
    } catch (err) {
        console.error(err);
        res.status(500).json({ success: false, message: 'Server Error' });
    }
});

module.exports = router;
