const mongoose = require('mongoose');

const walletTransactionSchema = new mongoose.Schema({
    artisanId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true,
        index: true,
    },
    type: {
        type: String,
        enum: ['COMMISSION', 'TOPUP'],
        required: true,
    },
    amount: {
        type: Number,
        required: true,
    },
    orderId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Order',
        default: null,
    },
    tutorialId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Tutorial',
        default: null,
    },
    tutorialRequestId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'TutorialRequest',
        default: null,
    },
    description: {
        type: String,
        trim: true,
        default: '',
    },
}, {
    timestamps: { createdAt: true, updatedAt: false },
});

module.exports = mongoose.models.WalletTransaction || mongoose.model('WalletTransaction', walletTransactionSchema);
