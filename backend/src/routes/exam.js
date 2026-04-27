const express = require('express');
const router = express.Router();
const examController = require('../controllers/examController');
const { protect } = require('../middleware/auth');

router.get('/:tutorialId', protect, examController.getExam);
router.post('/:tutorialId', protect, examController.submitExam);
router.get('/:tutorialId/result', protect, examController.getExamResult);

module.exports = router;