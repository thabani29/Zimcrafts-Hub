const mongoose = require('mongoose');

const orderSchema = new mongoose.Schema({
    orderNumber: {
        type: String,
        unique: true,
        required: true,
        default: () => `ZIM${Date.now()}${Math.floor(Math.random() * 9000 + 1000)}`,
    },
    user: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true,
    },
    artisan: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        default: null,
    },
    artisanIds: [{
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
    }],
    items: [{
        product: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'Product',
            required: true,
        },
        seller: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'User'
        },
        name: String,
        image: String,
        price: Number,
        quantity: { type: Number, required: true, min: 1 },
        customization: { type: mongoose.Schema.Types.Mixed, default: {} },
    }],
    shippingAddress: {
        name: String,
        street: String,
        city: String,
        state: String,
        country: { type: String, default: 'Zimbabwe' },
        zipCode: String,
        phone: String,
        email: String,
    },
    billingAddress: {
        sameAsShipping: { type: Boolean, default: true },
        name: String,
        street: String,
        city: String,
        state: String,
        country: { type: String, default: 'Zimbabwe' },
        zipCode: String,
    },
    paymentMethod: {
        type: String,
        enum: ['stripe', 'paypal', 'bank_transfer', 'cash_on_delivery', 'paynow', 'manual'],
        required: true,
    },
    paymentStatus: {
        type: String,
        enum: ['pending', 'paid', 'failed', 'refunded', 'partially_refunded'],
        default: 'pending',
    },
    paymentId: String,
    paymentReference: {
        type: String,
        unique: true,
        sparse: true,
    },
    paymentDetails: { type: mongoose.Schema.Types.Mixed, default: {} },
    subtotal: { type: Number, required: true },
    shippingCost: { type: Number, default: 0 },
    tax: { type: Number, default: 0 },
    discount: { type: Number, default: 0 },
    total: { type: Number, required: true },
    currency: { type: String, default: 'USD' },
    status: {
        type: String,
        enum: [
            'pending',
            'confirmed',
            'processing',
            'shipped',
            'awaiting_confirmation',
            'completed',
            'cancelled',
            'refunded'
        ],
        default: 'pending',
    },
    trackingNumber: String,
    shippingCarrier: String,
    notes: String,
    customerNotes: String,
    estimatedDelivery: Date,
    verificationCode: String,
    verificationCodeExpiresAt: Date,
    verificationCodeVerified: { type: Boolean, default: false },
    awaitingConfirmationStartedAt: Date,
    completionReminderSentAt: Date,
    completedAt: Date,
    deliveredAt: Date,
    cancelledAt: Date,
    refundedAt: Date,
    walletSettlementStatus: {
        type: String,
        enum: ['PENDING', 'SETTLED'],
        default: 'PENDING',
    },
    walletSettledAt: Date,
}, {
    timestamps: true
});

// ---------------------
// Safe stock revert hook
// ---------------------
orderSchema.pre('save', async function() {
    if (this.isModified('status') && this.status === 'cancelled') {
        for (const item of this.items) {
            await mongoose.model('Product').findByIdAndUpdate(
                item.product, { $inc: { stock: item.quantity } }
            );
        }
    }
});
module.exports = mongoose.model('Order', orderSchema);
