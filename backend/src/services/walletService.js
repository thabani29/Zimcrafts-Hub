const Wallet = require('../models/Wallet');
const WalletTransaction = require('../models/WalletTransaction');
const User = require('../models/User');
const Order = require('../models/Order');
const ErrorResponse = require('../utils/errorResponse');

const COMMISSION_RATE = 0.10;
const SUSPENSION_THRESHOLD = -10;
const WARNING_THRESHOLD = -5;
const WALLET_BALANCE_TRANSACTION_TYPES = ['COMMISSION', 'TOPUP'];

const roundMoney = (value) => Math.round((Number(value) + Number.EPSILON) * 100) / 100;

const buildSessionOptions = (session) => (session ? { session } : {});

const getWalletStatus = (balance) => (
    roundMoney(balance) <= SUSPENSION_THRESHOLD ? 'SUSPENDED' : 'ACTIVE'
);

const ensureWalletForArtisan = async(artisanId, session = null) => {
    if (!artisanId) {
        throw new ErrorResponse('Artisan is required for wallet operations', 400);
    }

    const options = buildSessionOptions(session);
    let wallet = await Wallet.findOne({ artisanId }, null, options);

    if (!wallet) {
        [wallet] = await Wallet.create([{
            artisanId,
            balance: 0,
            status: 'ACTIVE',
        }], options);
    }

    const transactionTotalsQuery = WalletTransaction.aggregate([{
        $match: {
            artisanId: wallet.artisanId,
            type: { $in: WALLET_BALANCE_TRANSACTION_TYPES },
        },
    }, {
        $group: {
            _id: null,
            total: { $sum: '$amount' },
        },
    }]);

    if (session) {
        transactionTotalsQuery.session(session);
    }

    const transactionTotals = await transactionTotalsQuery;

    const normalizedBalance = roundMoney(transactionTotals[0]?.total || 0);
    const expectedStatus = getWalletStatus(normalizedBalance);

    if (wallet.balance !== normalizedBalance || wallet.status !== expectedStatus) {
        wallet.balance = normalizedBalance;
        wallet.status = expectedStatus;
        await wallet.save(options);
    }

    return wallet;
};

const recordTransactions = async({
    artisanId,
    entries,
    session = null,
}) => {
    if (!Array.isArray(entries) || entries.length === 0) {
        throw new ErrorResponse('At least one wallet transaction entry is required', 400);
    }

    const options = buildSessionOptions(session);
    const wallet = await ensureWalletForArtisan(artisanId, session);

    const sanitizedEntries = entries.map((entry) => ({
        artisanId,
        type: entry.type,
        amount: roundMoney(entry.amount),
        orderId: entry.orderId || null,
        tutorialId: entry.tutorialId || null,
        tutorialRequestId: entry.tutorialRequestId || null,
        description: entry.description || '',
    }));

    const balanceDelta = sanitizedEntries.reduce((sum, entry) => sum + entry.amount, 0);
    wallet.balance = roundMoney(wallet.balance + balanceDelta);
    wallet.status = getWalletStatus(wallet.balance);
    await wallet.save(options);

    await WalletTransaction.insertMany(sanitizedEntries, options);

    return wallet;
};

const getBalanceSummary = async(artisanId) => {
    const wallet = await ensureWalletForArtisan(artisanId);
    const balance = roundMoney(wallet.balance);
    const amountOwed = balance < 0 ? roundMoney(Math.abs(balance)) : 0;
    const availableBalance = balance > 0 ? balance : 0;
    const netPosition = balance < 0 ? 'OWED_TO_SYSTEM' : balance > 0 ? 'AVAILABLE' : 'SETTLED';

    return {
        balance,
        availableBalance,
        amountOwed,
        netPosition,
        status: wallet.status,
        warningLevel: balance <= SUSPENSION_THRESHOLD
            ? 'SUSPENDED'
            : balance < 0
                ? (balance <= WARNING_THRESHOLD ? 'WARNING' : 'ARREARS')
                : 'HEALTHY',
        suspensionThreshold: SUSPENSION_THRESHOLD,
    };
};

const getTransactionHistory = async(artisanId, { page = 1, limit = 20 } = {}) => {
    const normalizedPage = Math.max(1, Number(page) || 1);
    const normalizedLimit = Math.min(100, Math.max(1, Number(limit) || 20));
    const skip = (normalizedPage - 1) * normalizedLimit;

    const query = { artisanId };
    query.type = { $in: WALLET_BALANCE_TRANSACTION_TYPES };
    const total = await WalletTransaction.countDocuments(query);
    const transactions = await WalletTransaction.find(query)
        .sort('-createdAt')
        .skip(skip)
        .limit(normalizedLimit)
        .populate('orderId', 'orderNumber total status createdAt');

    return {
        total,
        page: normalizedPage,
        limit: normalizedLimit,
        transactions,
    };
};

const assertArtisansCanReceiveOrders = async(artisanIds = [], session = null) => {
    const uniqueIds = [...new Set((artisanIds || []).filter(Boolean).map((id) => String(id)))];

    if (uniqueIds.length === 0) {
        return;
    }

    const wallets = await Wallet.find({
        artisanId: { $in: uniqueIds },
        status: 'SUSPENDED',
    }, null, buildSessionOptions(session));

    if (wallets.length === 0) {
        return;
    }

    const suspendedIds = wallets.map((wallet) => wallet.artisanId);
    const artisans = await User.find({ _id: { $in: suspendedIds } }, 'name');
    const artisanNames = artisans.map((artisan) => artisan.name).filter(Boolean);
    const detail = artisanNames.length > 0 ? `: ${artisanNames.join(', ')}` : '';

    throw new ErrorResponse(`One or more artisans cannot receive orders right now${detail}`, 409);
};

const settleOrderCompletion = async(order, session = null) => {
    if (!order) {
        throw new ErrorResponse('Order is required for wallet settlement', 400);
    }

    if (order.walletSettledAt) {
        return order;
    }

    const artisanTotals = new Map();

    for (const item of order.items || []) {
        if (!item.seller) {
            continue;
        }

        const sellerId = String(item.seller);
        const lineTotal = roundMoney((item.price || 0) * (item.quantity || 0));
        artisanTotals.set(sellerId, roundMoney((artisanTotals.get(sellerId) || 0) + lineTotal));
    }

    for (const [artisanId, orderAmount] of artisanTotals.entries()) {
        const commission = roundMoney(orderAmount * COMMISSION_RATE);
        await recordTransactions({
            artisanId,
            session,
            entries: [{
                type: 'COMMISSION',
                amount: -commission,
                orderId: order._id,
                description: `10% marketplace commission for ${order.orderNumber} on ${roundMoney(orderAmount).toFixed(2)}`,
            }],
        });
    }

    order.walletSettledAt = new Date();
    order.walletSettlementStatus = 'SETTLED';
    await order.save(buildSessionOptions(session));

    return order;
};

const settleTutorialApproval = async({
    artisanId,
    tutorial,
    tutorialRequestId,
    session = null,
}) => {
    if (!artisanId || !tutorial) {
        throw new ErrorResponse('Artisan and tutorial are required for tutorial commission settlement', 400);
    }

    if (!tutorialRequestId) {
        throw new ErrorResponse('Tutorial request is required for tutorial commission settlement', 400);
    }

    const price = roundMoney(tutorial.price || 0);
    if (price <= 0) {
        return ensureWalletForArtisan(artisanId, session);
    }

    const options = buildSessionOptions(session);
    const existingTransaction = await WalletTransaction.findOne({
        artisanId,
        tutorialRequestId,
        type: 'COMMISSION',
    }, null, options);

    if (existingTransaction) {
        return ensureWalletForArtisan(artisanId, session);
    }

    const commission = roundMoney(price * COMMISSION_RATE);

    return recordTransactions({
        artisanId,
        session,
        entries: [{
            type: 'COMMISSION',
            amount: -commission,
            tutorialId: tutorial._id,
            tutorialRequestId,
            description: `10% tutorial commission for ${tutorial.title} on ${price.toFixed(2)}`,
        }],
    });
};

const applyCommissionByOrderId = async(orderId, session = null) => {
    const order = await Order.findById(orderId, null, buildSessionOptions(session));

    if (!order) {
        throw new ErrorResponse('Order not found', 404);
    }

    if (order.status !== 'completed') {
        throw new ErrorResponse('Commission can only be applied to completed orders', 400);
    }

    return settleOrderCompletion(order, session);
};

module.exports = {
    COMMISSION_RATE,
    SUSPENSION_THRESHOLD,
    ensureWalletForArtisan,
    recordTransactions,
    getBalanceSummary,
    getTransactionHistory,
    assertArtisansCanReceiveOrders,
    settleOrderCompletion,
    settleTutorialApproval,
    applyCommissionByOrderId,
    getWalletStatus,
    roundMoney,
};
