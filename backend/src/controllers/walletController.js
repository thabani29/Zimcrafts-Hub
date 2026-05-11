const createPaynowClient = require('../config/paynow');
const asyncHandler = require('../utils/asyncHandler');
const ErrorResponse = require('../utils/errorResponse');
const WalletTopupSession = require('../models/WalletTopupSession');
const {
    ensureWalletForArtisan,
    getBalanceSummary,
    getTransactionHistory,
    recordTransactions,
    applyCommissionByOrderId,
} = require('../services/walletService');
const withMongoTransaction = require('../utils/withMongoTransaction');
const { buildBackendUrl, buildPublicAppUrl } = require('../utils/publicUrls');

const hasValidPaynowConfig = () => {
    const integrationId = String(process.env.PAYNOW_INTEGRATION_ID || '').trim();
    const integrationKey = String(process.env.PAYNOW_INTEGRATION_KEY || '').trim();

    return Boolean(
        integrationId &&
        integrationKey &&
        integrationId !== 'your_paynow_integration_id' &&
        integrationKey !== 'your_paynow_integration_key'
    );
};

const getPaymentState = (paymentStatus) => {
    const statusText = String(paymentStatus?.status || '').toLowerCase();

    if (typeof paymentStatus?.paid === 'function' && paymentStatus.paid()) {
        return 'paid';
    }

    if (statusText === 'paid' || statusText === 'awaiting delivery' || statusText === 'delivered') {
        return 'paid';
    }

    if (statusText === 'cancelled') {
        return 'cancelled';
    }

    if (statusText === 'failed' || statusText === 'error') {
        return 'failed';
    }

    return 'initiated';
};

const finalizeTopupSession = async(session, paymentStatus) => withMongoTransaction(async(dbSession) => {
    session.paymentMeta = {
        ...session.paymentMeta,
        paynowStatus: paymentStatus?.status || null,
        paynowReference: paymentStatus?.reference || session.reference,
        paynowAmount: paymentStatus?.amount || session.amount,
        lastPolledAt: new Date(),
    };

    const paymentState = getPaymentState(paymentStatus);

    if (paymentState === 'paid' && session.status !== 'paid') {
        await recordTransactions({
            artisanId: session.artisanId,
            session: dbSession,
            entries: [{
                type: 'TOPUP',
                amount: session.amount,
                description: `Wallet top-up via Paynow (${session.reference})`,
            }],
        });
        session.status = 'paid';
    } else if (paymentState === 'cancelled' || paymentState === 'failed') {
        session.status = paymentState;
    }

    await session.save(dbSession ? { session: dbSession } : {});

    return {
        paymentState,
        wallet: await ensureWalletForArtisan(session.artisanId, dbSession),
    };
});

exports.getWalletBalance = asyncHandler(async(req, res) => {
    const summary = await getBalanceSummary(req.user.id);

    res.json({
        success: true,
        data: summary,
    });
});

exports.getWalletTransactions = asyncHandler(async(req, res) => {
    const data = await getTransactionHistory(req.user.id, {
        page: req.query.page,
        limit: req.query.limit,
    });

    res.json({
        success: true,
        count: data.transactions.length,
        total: data.total,
        page: data.page,
        data: data.transactions,
    });
});

exports.startWalletTopup = asyncHandler(async(req, res) => {
    if (!hasValidPaynowConfig()) {
        throw new ErrorResponse('Paynow is not configured yet. Add your real PAYNOW_INTEGRATION_ID and PAYNOW_INTEGRATION_KEY in backend/.env.', 500);
    }

    const amount = Number(req.body.amount);
    if (!Number.isFinite(amount) || amount <= 0) {
        throw new ErrorResponse('A valid top-up amount is required', 400);
    }

    await ensureWalletForArtisan(req.user.id);

    const paynow = createPaynowClient();
    const reference = `ZIMWALLET-${Date.now()}-${Math.floor(Math.random() * 9000 + 1000)}`;

    const customReturnUrl = req.body.returnUrl;
    if (customReturnUrl) {
        paynow.returnUrl = `${customReturnUrl}${customReturnUrl.includes('?') ? '&' : '?'}walletReference=${encodeURIComponent(reference)}`;
    } else {
        paynow.returnUrl = buildPublicAppUrl(`/seller-dashboard?walletReference=${encodeURIComponent(reference)}`);
    }
    
    paynow.cancelUrl = req.body.cancelUrl || paynow.returnUrl;
    paynow.resultUrl = buildBackendUrl(`/api/v1/wallet/topup/result/${encodeURIComponent(reference)}`);

    const payment = paynow.createPayment(reference, req.user.email);
    payment.add('ZimCrafts Hub Wallet Top-up', amount);

    const response = await paynow.send(payment);
    if (!response.success) {
        const paynowMessage = String(response.error || '').trim();
        const friendlyMessage = paynowMessage.toLowerCase() === 'invalid id.'
            ? 'Paynow rejected the merchant credentials. Check PAYNOW_INTEGRATION_ID and PAYNOW_INTEGRATION_KEY in backend/.env.'
            : (paynowMessage || 'Unable to start wallet top-up');
        throw new ErrorResponse(friendlyMessage, 500);
    }

    const session = await WalletTopupSession.create({
        artisanId: req.user.id,
        amount,
        reference,
        pollUrl: response.pollUrl,
        redirectUrl: response.redirectUrl,
        paymentMeta: {
            initiatedAt: new Date(),
        },
    });

    res.status(201).json({
        success: true,
        data: {
            reference: session.reference,
            amount: session.amount,
            redirectUrl: session.redirectUrl,
            pollUrl: session.pollUrl,
        },
    });
});

exports.confirmWalletTopup = asyncHandler(async(req, res) => {
    const paynow = createPaynowClient();
    const reference = req.params.reference || req.body.reference;
    const session = await WalletTopupSession.findOne({ reference });

    if (!session) {
        throw new ErrorResponse('Wallet top-up session not found', 404);
    }

    if (String(session.artisanId) !== String(req.user.id) && req.user.role !== 'admin') {
        throw new ErrorResponse('Not authorized', 403);
    }

    const paynowStatus = await paynow.pollTransaction(session.pollUrl);
    const result = await finalizeTopupSession(session, paynowStatus);

    res.json({
        success: true,
        data: {
            reference: session.reference,
            paymentStatus: result.paymentState,
            wallet: {
                balance: result.wallet.balance,
                status: result.wallet.status,
            },
        },
    });
});

exports.handleWalletTopupResult = asyncHandler(async(req, res) => {
    const paynow = createPaynowClient();
    const reference = req.params.reference || req.body.reference;
    const session = await WalletTopupSession.findOne({ reference });

    if (!session) {
        return res.status(404).json({ success: false, message: 'Wallet top-up session not found' });
    }

    const paynowStatus = await paynow.pollTransaction(session.pollUrl);
    const result = await finalizeTopupSession(session, paynowStatus);

    res.status(200).json({
        success: true,
        data: {
            reference: session.reference,
            paymentStatus: result.paymentState,
        },
    });
});

exports.applyCommission = asyncHandler(async(req, res) => {
    const { orderId } = req.body;

    if (!orderId) {
        throw new ErrorResponse('orderId is required', 400);
    }

    const order = await withMongoTransaction((session) => applyCommissionByOrderId(orderId, session));

    res.json({
        success: true,
        data: order,
    });
});
