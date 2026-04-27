const express = require('express');
const router = express.Router();
const enrollmentController = require('../controllers/enrollmentController');
const { protect } = require('../middleware/auth');

router.get('/paynow/confirm/:reference', protect, enrollmentController.confirmTutorialPayment);
router.post('/paynow/confirm/:reference', protect, enrollmentController.confirmTutorialPayment);
router.get('/paynow/result/:reference', enrollmentController.handleTutorialPaymentResult);
router.post('/paynow/result/:reference', enrollmentController.handleTutorialPaymentResult);
router.post('/:tutorialId/paynow', protect, enrollmentController.startTutorialPayment);
router.post('/:tutorialId', protect, enrollmentController.enrollTutorial);
router.get('/:tutorialId', protect, enrollmentController.getEnrollment);
router.post('/:tutorialId/lessons/:lessonId/exam', protect, enrollmentController.submitLessonExam);

module.exports = router;
