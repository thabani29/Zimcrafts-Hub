const mongoose = require('mongoose');

const walletTopupSessionSchema = new mongoose.Schema({
    artisanId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true,
        index: true,
    },
    reference: {
        type: String,
        required: true,
        unique: true,
    },
    amount: {
        type: Number,
        required: true,
        min: 0.01,
    },
    pollUrl: {
        type: String,
        required: true,
    },
    redirectUrl: {
        type: String,
        required: true,
    },
    status: {
        type: String,
        enum: ['initiated', 'paid', 'failed', 'cancelled'],
        default: 'initiated',
    },
    paymentMeta: {
        type: mongoose.Schema.Types.Mixed,
        default: {},
    },
}, {
    timestamps: true,
});

module.exports = mongoose.models.WalletTopupSession || mongoose.model('WalletTopupSession', walletTopupSessionSchema);
