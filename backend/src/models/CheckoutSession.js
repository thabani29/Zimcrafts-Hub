const mongoose = require('mongoose');

const checkoutSessionSchema = new mongoose.Schema({
    user: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true,
    },
    reference: {
        type: String,
        required: true,
        unique: true,
    },
    pollUrl: {
        type: String,
        required: true,
    },
    redirectUrl: {
        type: String,
        required: true,
    },
    paymentMethod: {
        type: String,
        enum: ['paynow'],
        default: 'paynow',
    },
    status: {
        type: String,
        enum: ['initiated', 'paid', 'failed', 'cancelled'],
        default: 'initiated',
    },
    stockReleased: {
        type: Boolean,
        default: false,
    },
    reservedItems: [{
        product: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'Product',
            required: true,
        },
        quantity: {
            type: Number,
            required: true,
            min: 1,
        },
    }],
    orderPayload: {
        items: [{
            product: mongoose.Schema.Types.ObjectId,
            seller: mongoose.Schema.Types.ObjectId,
            name: String,
            image: String,
            price: Number,
            quantity: Number,
            customization: { type: mongoose.Schema.Types.Mixed, default: {} },
        }],
        shippingAddress: {
            name: String,
            street: String,
            city: String,
            state: String,
            country: String,
            zipCode: String,
            phone: String,
            email: String,
        },
        billingAddress: {
            sameAsShipping: Boolean,
            name: String,
            street: String,
            city: String,
            state: String,
            country: String,
            zipCode: String,
        },
        subtotal: Number,
        shippingCost: Number,
        tax: Number,
        discount: Number,
        total: Number,
        notes: String,
        customerNotes: String,
        currency: {
            type: String,
            default: 'USD',
        },
    },
    order: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Order',
    },
    paymentMeta: {
        type: mongoose.Schema.Types.Mixed,
        default: {},
    },
}, {
    timestamps: true,
});

module.exports = mongoose.model('CheckoutSession', checkoutSessionSchema);
