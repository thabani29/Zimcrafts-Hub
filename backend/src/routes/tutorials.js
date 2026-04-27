const express = require('express');
const multer = require('multer');
const router = express.Router();
const tutorialController = require('../controllers/tutorialController');
const tutorialRequestController = require('../controllers/tutorialRequestController');
const { protect, authorize } = require('../middleware/auth');

const storage = multer.memoryStorage();
const videoUpload = multer({
    storage,
    limits: { fileSize: 50 * 1024 * 1024 },
    fileFilter: (req, file, cb) => {
        const allowed = /mp4|webm|mov|avi|mkv/;
        const ext = file.originalname.toLowerCase();
        if (allowed.test(ext)) {
            return cb(null, true);
        }
        cb(new Error('Only video files are allowed'));
    }
});

router.get('/', tutorialController.getTutorials);
router.get('/my-tutorials', protect, authorize('admin', 'artisan/seller'), tutorialController.getMyTutorials);
router.post('/upload-video', protect, authorize('admin', 'artisan/seller'), videoUpload.single('video'), tutorialController.uploadVideo);
router.get('/:id/request-status', protect, tutorialRequestController.getMyTutorialRequestStatus);
router.post('/:id/request-enrollment', protect, tutorialRequestController.requestEnrollment);
router.get('/:id', tutorialController.getTutorial);
router.post('/', protect, authorize('admin', 'artisan/seller'), tutorialController.createTutorial);
router.put('/:id', protect, authorize('admin', 'artisan/seller'), tutorialController.updateTutorial);
router.delete('/:id', protect, authorize('admin', 'artisan/seller'), tutorialController.deleteTutorial);

module.exports = router;
