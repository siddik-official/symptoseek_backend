// middleware/upload.js
const multer = require('multer');

const MAX_FILE_SIZE = parseInt(process.env.MAX_FILE_SIZE_MB) * 1024 * 1024; // Convert MB to Bytes

const storage = multer.memoryStorage();

const fileFilter = (req, file, cb) => {
    // Allow images and PDFs
    if (file.mimetype.startsWith('image/') || file.mimetype === 'application/pdf') {
        cb(null, true);
    } else {
        cb(new Error('Invalid file type. Only images and PDFs are allowed.'), false);
    }
};

const upload = multer({
    storage: storage,
    limits: { fileSize: MAX_FILE_SIZE },
    fileFilter: fileFilter,
});

module.exports = upload;