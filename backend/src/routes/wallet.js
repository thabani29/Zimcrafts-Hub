const express = require('express');
const router = express.Router();
const walletController = require('../controllers/walletController');
const { protect, authorize } = require('../middleware/auth');

router.get('/topup/result/:reference', walletController.handleWalletTopupResult);
router.post('/topup/result/:reference', walletController.handleWalletTopupResult);

router.use(protect);
router.use(authorize('artisan/seller', 'admin'));

router.get('/balance', walletController.getWalletBalance);
router.get('/transactions', walletController.getWalletTransactions);
router.post('/topup', walletController.startWalletTopup);
router.get('/topup/confirm/:reference', walletController.confirmWalletTopup);
router.post('/topup/confirm/:reference', walletController.confirmWalletTopup);
router.post('/apply-commission', authorize('admin'), walletController.applyCommission);

module.exports = router;
