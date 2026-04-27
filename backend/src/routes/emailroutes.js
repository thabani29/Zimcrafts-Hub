// backend/src/routes/emailRoutes.js
const express = require('express');
const router = express.Router();
const {
    sendWelcomeEmailService,
    sendOrderConfirmationService,
    sendPasswordResetService,
    sendVerificationEmail
} = require('../controllers/emailController');

// ---------------------
// Async handler to reduce try-catch repetition
// ---------------------
const asyncHandler = fn => (req, res, next) =>
    Promise.resolve(fn(req, res, next)).catch(next);

// ---------------------
// TEST ROUTE
// ---------------------
router.get('/test', (req, res) => {
    res.status(200).json({
        success: true,
        message: 'Email routes working'
    });
});

// ---------------------
// Send welcome email
// ---------------------
router.post('/welcome', asyncHandler(async(req, res) => {
    const { user } = req.body;
    if (!user || !user.email) {
        return res.status(400).json({ success: false, message: 'User data required' });
    }

    await sendWelcomeEmailService(user);

    res.status(200).json({ success: true, message: 'Welcome email sent' });
}));

// ---------------------
// Send order confirmation email
// ---------------------
router.post('/order', asyncHandler(async(req, res) => {
    const { order, user } = req.body;
    if (!order || !user || !user.email) {
        return res.status(400).json({ success: false, message: 'Order and user data required' });
    }

    await sendOrderConfirmationService(order, user);

    res.status(200).json({ success: true, message: 'Order confirmation email sent' });
}));

// ---------------------
// Send password reset email
// ---------------------
router.post('/password-reset', asyncHandler(async(req, res) => {
    const { user, token } = req.body;
    if (!user || !user.email || !token) {
        return res.status(400).json({ success: false, message: 'User and token required' });
    }

    await sendPasswordResetService(user, token);

    res.status(200).json({ success: true, message: 'Password reset email sent' });
}));

// ---------------------
// Resend verification email
// ---------------------
router.post('/resend-verification', asyncHandler(async(req, res) => {
    const { user, token } = req.body;
    if (!user || !user.email || !token) {
        return res.status(400).json({ success: false, message: 'User and token required' });
    }

    await sendVerificationEmail(user, token);

    res.status(200).json({ success: true, message: 'Verification email resent' });
}));

module.exports = router;