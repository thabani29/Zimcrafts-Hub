const mongoose = require('mongoose');

const walletSchema = new mongoose.Schema({
    artisanId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true,
        unique: true,
        index: true,
    },
    balance: {
        type: Number,
        default: 0,
    },
    status: {
        type: String,
        enum: ['ACTIVE', 'SUSPENDED'],
        default: 'ACTIVE',
    },
}, {
    timestamps: true,
});

module.exports = mongoose.models.Wallet || mongoose.model('Wallet', walletSchema);
