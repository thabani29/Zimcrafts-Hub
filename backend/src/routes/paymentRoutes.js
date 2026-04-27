const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/auth');
const {
    createPayment,
    checkPaymentStatus,
    handlePaynowResult,
} = require('../controllers/paymentController');

router.post('/paynow/checkout', protect, createPayment);
router.get('/paynow/confirm/:reference', protect, checkPaymentStatus);
router.post('/paynow/confirm/:reference', protect, checkPaymentStatus);
router.get('/paynow/result/:reference', handlePaynowResult);
router.post('/paynow/result/:reference', handlePaynowResult);

// Legacy endpoints
router.post('/', protect, createPayment);
router.post('/status/:reference', protect, checkPaymentStatus);
router.post('/status', protect, checkPaymentStatus);

module.exports = router;
