const express = require('express');
const router = express.Router();
const { protect, authorize } = require('../middleware/auth');
const imagekitController = require('../controllers/imagekitController');

router.get('/', protect, authorize('admin', 'artisan/seller'), imagekitController.getImageKitAuth);

module.exports = router;