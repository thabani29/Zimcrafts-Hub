const asyncHandler = require('../utils/asyncHandler');

exports.createPayment = asyncHandler(async(req, res) => {
    res.status(410).json({
        success: false,
        message: 'Customer Paynow checkout has been removed. Create orders through /api/v1/orders and use /api/v1/wallet/topup for artisan recharges.',
    });
});

exports.checkPaymentStatus = asyncHandler(async(req, res) => {
    res.status(410).json({
        success: false,
        message: 'Customer Paynow checkout has been removed. Use /api/v1/orders for order placement.',
    });
});

exports.handlePaynowResult = asyncHandler(async(req, res) => {
    res.status(410).json({
        success: false,
        message: 'Customer Paynow checkout has been removed.',
    });
});
