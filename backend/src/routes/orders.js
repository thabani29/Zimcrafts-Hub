const express = require('express');
const router = express.Router();
const orderController = require('../controllers/orderController');
const { protect, authorize } = require('../middleware/auth');

router.use(protect);

// -----------------
// USER ROUTES
// -----------------
router.post('/', orderController.createOrder);
router.get('/my-orders', orderController.getOrders);
router.get('/seller-analytics', authorize('artisan', 'artisan/seller', 'admin'), orderController.getSellerAnalytics);
router.get('/seller-orders', authorize('artisan', 'artisan/seller', 'admin'), orderController.getSellerOrders);

// -----------------
// ADMIN ROUTES
// -----------------
router.get('/stats', authorize('admin'), orderController.getOrderStats);
router.get('/', authorize('admin'), orderController.getOrders);
router.put('/:id/status', authorize('artisan', 'artisan/seller', 'admin'), orderController.updateSellerOrderStatus);
router.post('/:id/verify-code', orderController.verifyOrderCode);

// -----------------
// DYNAMIC ROUTES (LAST)
// -----------------
router.get('/:id', orderController.getOrder);
router.put('/:id/pay', orderController.updateOrderToPaid);
router.put('/:id/cancel', orderController.cancelOrder);
router.put('/:id/deliver', authorize('admin'), orderController.updateOrderToDelivered);

module.exports = router;
