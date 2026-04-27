const mongoose = require('mongoose');

const tutorialPaymentSessionSchema = new mongoose.Schema({
    reference: {
        type: String,
        required: true,
        unique: true,
    },
    userId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true,
    },
    tutorialId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Tutorial',
        required: true,
    },
    artisanId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true,
    },
    amount: {
        type: Number,
        required: true,
        min: 0,
    },
    currency: {
        type: String,
        default: 'USD',
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
    enrollmentId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Enrollment',
    },
    paymentMeta: {
        type: mongoose.Schema.Types.Mixed,
        default: {},
    },
}, {
    timestamps: true,
});

module.exports = mongoose.model('TutorialPaymentSession', tutorialPaymentSessionSchema);
