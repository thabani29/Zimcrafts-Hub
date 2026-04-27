const Order = require('../models/Order');
const Product = require('../models/Product');
const Tutorial = require('../models/Tutorial');
const WalletTransaction = require('../models/WalletTransaction');
const asyncHandler = require('../utils/asyncHandler');
const ErrorResponse = require('../utils/errorResponse');
const withMongoTransaction = require('../utils/withMongoTransaction');
const { createOrderForCustomer } = require('../services/orderService');
const { COMMISSION_RATE, roundMoney, settleOrderCompletion } = require('../services/walletService');
const {
    sendOrderConfirmationService,
    sendDeliveryVerificationCodeService,
    sendNewOrderToSellerService,
} = require('./emailController');

const DELIVERY_CONFIRMATION_WINDOW_MS = 7 * 24 * 60 * 60 * 1000;

exports.createOrder = asyncHandler(async(req, res) => {
    const order = await withMongoTransaction((session) => createOrderForCustomer(req.body, req.user, session));

    await sendOrderConfirmationService(order, req.user);
    await sendNewOrderToSellerService(order, req.user);

    res.status(201).json({
        success: true,
        data: order,
    });
});

exports.getOrders = asyncHandler(async(req, res) => {
    let query;

    if (req.user.role !== 'admin') {
        query = Order.find({ user: req.user.id });
    } else {
        query = Order.find();
    }

    query = query
        .populate('user', 'name email')
        .populate('items.seller', 'name Cell')
        .populate('items.product', 'name images')
        .sort('-createdAt');

    const page = parseInt(req.query.page, 10) || 1;
    const limit = parseInt(req.query.limit, 10) || 10;
    const skip = (page - 1) * limit;

    const total = await Order.countDocuments(query.getQuery());
    const orders = await query.skip(skip).limit(limit);

    res.json({
        success: true,
        count: orders.length,
        total,
        data: orders,
    });
});

exports.getOrder = asyncHandler(async(req, res, next) => {
    const order = await Order.findById(req.params.id)
        .populate('user', 'name email')
        .populate('items.product', 'name images description')
        .populate('items.seller', 'name Cell');

    if (!order) {
        return next(new ErrorResponse('Order not found', 404));
    }

    if (req.user.role !== 'admin' && order.user._id.toString() !== req.user.id) {
        return next(new ErrorResponse('Not authorized', 403));
    }

    res.json({
        success: true,
        data: order,
    });
});

exports.updateOrderToPaid = asyncHandler(async(req, res, next) => {
    const order = await Order.findById(req.params.id);

    if (!order) {
        return next(new ErrorResponse('Order not found', 404));
    }

    if (req.user.role !== 'admin' && order.user.toString() !== req.user.id) {
        return next(new ErrorResponse('Not authorized', 403));
    }

    order.paymentStatus = 'paid';
    order.paymentId = req.body.paymentId || '';
    order.paymentDetails = req.body.paymentDetails || {};
    order.status = 'confirmed';

    const updatedOrder = await order.save();

    await sendOrderConfirmationService(updatedOrder, req.user);
    await sendNewOrderToSellerService(updatedOrder, req.user);

    res.json({
        success: true,
        data: updatedOrder,
    });
});

exports.updateOrderToDelivered = asyncHandler(async(req, res, next) => {
    const order = await Order.findById(req.params.id);

    if (!order) {
        return next(new ErrorResponse('Order not found', 404));
    }

    order.status = 'delivered';
    order.deliveredAt = Date.now();

    const updatedOrder = await order.save();

    res.json({
        success: true,
        data: updatedOrder,
    });
});

const isSellerOrder = (order, userId) => (
    order.items.some((item) => item.seller && String(item.seller) === String(userId))
);

exports.updateSellerOrderStatus = asyncHandler(async(req, res, next) => {
    const order = await Order.findById(req.params.id).populate('user', 'name email');

    if (!order) {
        return next(new ErrorResponse('Order not found', 404));
    }

    if (req.user.role !== 'admin' && !isSellerOrder(order, req.user.id)) {
        return next(new ErrorResponse('Not authorized', 403));
    }

    const { status, trackingNumber, shippingCarrier } = req.body;
    const allowedStatuses = ['pending', 'confirmed', 'processing', 'shipped', 'awaiting_confirmation', 'cancelled'];

    if (!status || !allowedStatuses.includes(status)) {
        return next(new ErrorResponse('Invalid status provided', 400));
    }

    order.status = status;
    if (trackingNumber !== undefined) {
        order.trackingNumber = trackingNumber;
    }
    if (shippingCarrier !== undefined) {
        order.shippingCarrier = shippingCarrier;
    }

    if (status !== 'awaiting_confirmation') {
        order.verificationCode = undefined;
        order.verificationCodeExpiresAt = undefined;
        order.awaitingConfirmationStartedAt = undefined;
        order.completionReminderSentAt = undefined;
    }

    if (status === 'awaiting_confirmation') {
        const verificationCode = Math.floor(100000 + Math.random() * 900000).toString();
        order.verificationCode = verificationCode;
        order.verificationCodeExpiresAt = Date.now() + DELIVERY_CONFIRMATION_WINDOW_MS;
        order.verificationCodeVerified = false;
        order.awaitingConfirmationStartedAt = new Date();
        order.completionReminderSentAt = undefined;
        order.completedAt = undefined;

        await sendDeliveryVerificationCodeService(order, order.user, verificationCode);
    }

    if (status === 'cancelled') {
        order.cancelledAt = Date.now();
    }

    const updatedOrder = await order.save();

    res.json({
        success: true,
        data: updatedOrder,
    });
});

exports.verifyOrderCode = asyncHandler(async(req, res, next) => {
    const order = await Order.findById(req.params.id);

    if (!order) {
        return next(new ErrorResponse('Order not found', 404));
    }

    if (order.user.toString() !== req.user.id) {
        return next(new ErrorResponse('Not authorized', 403));
    }

    if (order.status !== 'awaiting_confirmation') {
        return next(new ErrorResponse('Order is not awaiting confirmation', 400));
    }

    const { code } = req.body;

    if (!code) {
        return next(new ErrorResponse('Verification code is required', 400));
    }

    if (order.verificationCodeVerified) {
        return next(new ErrorResponse('Verification code has already been used', 400));
    }

    if (!order.verificationCode || order.verificationCode !== code) {
        return next(new ErrorResponse('Invalid verification code', 400));
    }

    if (order.verificationCodeExpiresAt && order.verificationCodeExpiresAt < Date.now()) {
        return next(new ErrorResponse('Verification code has expired', 400));
    }

    const updatedOrder = await withMongoTransaction(async(session) => {
        const orderInSession = await Order.findById(req.params.id, null, session ? { session } : {});

        if (!orderInSession) {
            throw new ErrorResponse('Order not found', 404);
        }

        orderInSession.status = 'completed';
        orderInSession.verificationCodeVerified = true;
        orderInSession.completedAt = Date.now();
        orderInSession.verificationCode = undefined;
        orderInSession.verificationCodeExpiresAt = undefined;
        orderInSession.awaitingConfirmationStartedAt = undefined;
        orderInSession.completionReminderSentAt = undefined;

        await orderInSession.save(session ? { session } : {});
        await settleOrderCompletion(orderInSession, session);

        return orderInSession;
    });

    res.json({
        success: true,
        data: updatedOrder,
    });
});

exports.getSellerOrders = asyncHandler(async(req, res) => {
    const page = parseInt(req.query.page, 10) || 1;
    const limit = parseInt(req.query.limit, 10) || 10;
    const skip = (page - 1) * limit;

    const query = { 'items.seller': req.user.id };

    const total = await Order.countDocuments(query);
    const orders = await Order.find(query)
        .sort('-createdAt')
        .skip(skip)
        .limit(limit)
        .populate('user', 'name email Cell')
        .populate('items.product', 'name productimages');

    const filteredOrders = orders.map((order) => {
        const safeOrder = order.toObject();
        safeOrder.items = safeOrder.items.filter(
            (item) => item.seller && String(item.seller) === String(req.user.id)
        );
        return safeOrder;
    });

    res.json({
        success: true,
        count: filteredOrders.length,
        total,
        data: filteredOrders,
    });
});

exports.getSellerAnalytics = asyncHandler(async(req, res) => {
    const [products, totalOrders, totalTutorials, tutorialCommissionTransactions] = await Promise.all([
        Product.find({ createdBy: req.user.id }).select('status price soldCount'),
        Order.countDocuments({ 'items.seller': req.user.id }),
        Tutorial.countDocuments({ artisanId: req.user.id }),
        WalletTransaction.find({
            artisanId: req.user.id,
            type: 'COMMISSION',
            tutorialRequestId: { $ne: null },
        }).select('amount'),
    ]);

    const totalProducts = products.length;
    const activeProducts = products.filter((product) => product.status === 'active').length;
    const totalUnitsSold = products.reduce((sum, product) => sum + (Number(product.soldCount) || 0), 0);
    const productRevenue = roundMoney(
        products.reduce(
            (sum, product) => sum + ((Number(product.price) || 0) * (Number(product.soldCount) || 0)),
            0
        )
    );
    const tutorialRevenue = roundMoney(
        tutorialCommissionTransactions.reduce((sum, transaction) => {
            const commissionAmount = Math.abs(Number(transaction.amount) || 0);
            return sum + (commissionAmount / COMMISSION_RATE);
        }, 0)
    );

    res.json({
        success: true,
        data: {
            totalProducts,
            activeProducts,
            totalUnitsSold,
            totalOrders,
            totalTutorials,
            productRevenue,
            tutorialRevenue,
            totalRevenue: roundMoney(productRevenue + tutorialRevenue),
        },
    });
});

exports.cancelOrder = asyncHandler(async(req, res, next) => {
    const order = await Order.findById(req.params.id);

    if (!order) {
        return next(new ErrorResponse('Order not found', 404));
    }

    if (req.user.role !== 'admin' && order.user.toString() !== req.user.id) {
        return next(new ErrorResponse('Not authorized', 403));
    }

    if (!['pending', 'confirmed'].includes(order.status)) {
        return next(new ErrorResponse('Order cannot be cancelled', 400));
    }

    order.status = 'cancelled';
    order.cancelledAt = Date.now();

    const updatedOrder = await order.save();

    res.json({
        success: true,
        data: updatedOrder,
    });
});

exports.getOrderStats = asyncHandler(async(req, res) => {
    const stats = await Order.aggregate([{
        $match: { status: 'delivered' },
    }, {
        $group: {
            _id: null,
            totalOrders: { $sum: 1 },
            totalSales: { $sum: '$total' },
            avgOrderValue: { $avg: '$total' },
            minOrderValue: { $min: '$total' },
            maxOrderValue: { $max: '$total' },
        },
    }]);

    const recentOrders = await Order.find()
        .sort('-createdAt')
        .limit(5)
        .populate('user', 'name')
        .select('orderNumber total status createdAt');

    res.json({
        success: true,
        data: {
            stats: stats[0] || {},
            recentOrders,
        },
    });
});
