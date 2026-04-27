// backend/src/middleware/upload.js
const multer = require('multer');
const path = require('path');
const imagekit = require('../services/imagekitService');

// In-memory storage for multer
const storage = multer.memoryStorage();

// Allowed file types
const allowedFileTypes = /jpeg|jpg|png|gif|webp/;

// Check file type
const checkFileType = (file, cb) => {
    const extname = allowedFileTypes.test(path.extname(file.originalname).toLowerCase());
    const mimetype = allowedFileTypes.test(file.mimetype);

    if (mimetype && extname) {
        return cb(null, true);
    } else {
        cb(new Error('Error: Images only! (jpeg, jpg, png, gif, webp)'));
    }
};

// Multer upload config
const upload = multer({
    storage: storage,
    limits: { fileSize: 5 * 1024 * 1024 }, // 5MB
    fileFilter: (req, file, cb) => checkFileType(file, cb)
});

// Upload multiple files to ImageKit
const uploadMultipleToImageKit = async(files) => {
    try {
        const uploadPromises = files.map(async(file) => {
            try {
                const response = await imagekit.upload({
                    file: file.buffer.toString('base64'),
                    fileName: `product_${Date.now()}_${file.originalname}`,
                    folder: '/products'
                });

                return {
                    url: response.url,
                    fileId: response.fileId,
                    name: file.originalname
                };
            } catch (err) {
                console.error('Error uploading single file:', err);
                throw err;
            }
        });

        return await Promise.all(uploadPromises);
    } catch (err) {
        console.error('Error uploading multiple files:', err);
        throw err; // Throw error to be caught by controller
    }
};

// Error handling middleware
const handleUploadError = (err, req, res, next) => {
    if (err instanceof multer.MulterError) {
        if (err.code === 'LIMIT_FILE_SIZE') {
            return res.status(400).json({
                success: false,
                message: 'File too large. Maximum size is 5MB'
            });
        }
        if (err.code === 'LIMIT_UNEXPECTED_FILE') {
            return res.status(400).json({
                success: false,
                message: 'Too many files uploaded. Maximum is 5 files.'
            });
        }
        return res.status(400).json({
            success: false,
            message: err.message
        });
    }

    if (err) {
        return res.status(400).json({
            success: false,
            message: err.message || 'File upload error'
        });
    }

    next();
};

module.exports = {
    upload,
    uploadMultipleToImageKit,
    handleUploadError
};