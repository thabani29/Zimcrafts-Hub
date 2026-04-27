const express = require('express');
const router = express.Router();
const tutorialRequestController = require('../controllers/tutorialRequestController');
const { protect, authorize } = require('../middleware/auth');

router.use(protect);

router.get('/artisan', authorize('admin', 'artisan/seller'), tutorialRequestController.getArtisanTutorialRequests);
router.post('/:id/respond', authorize('admin', 'artisan/seller'), tutorialRequestController.respondToTutorialRequest);

module.exports = router;
