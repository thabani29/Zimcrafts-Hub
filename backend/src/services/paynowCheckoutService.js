const CheckoutSession = require('../models/CheckoutSession');
const mongoose = require('mongoose');
const Order = require('../models/Order');
const Product = require('../models/Product');
const User = require('../models/User');
const ErrorResponse = require('../utils/errorResponse');
const {
    sendOrderConfirmationService,
    sendNewOrderToSellerService,
} = require('../controllers/emailController');

const normalizePhone = (phone) => String(phone || '').replace(/[^\d]/g, '');

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

    return 'pending';
};

exports.buildOrderPayload = async({ items = [], shippingAddress, billingAddress, shippingCost = 0, tax = 0, discount = 0, notes = '' }, user) => {
    if (!Array.isArray(items) || items.length === 0) {
        throw new ErrorResponse('No order items provided', 400);
    }

    if (!shippingAddress || typeof shippingAddress !== 'object') {
        throw new ErrorResponse('Shipping information is required', 400);
    }

    const requiredShippingFields = ['name', 'phone', 'street', 'city', 'state', 'zipCode'];
    const missingField = requiredShippingFields.find(
        (field) => !shippingAddress[field] || String(shippingAddress[field]).trim() === ''
    );

    if (missingField) {
        throw new ErrorResponse('Please provide your full name, phone number and complete shipping address', 400);
    }

    const normalizedPhone = normalizePhone(shippingAddress.phone);
    if (!normalizedPhone) {
        throw new ErrorResponse('A valid phone number is required', 400);
    }

    let subtotal = 0;
    const orderItems = [];
    const reservedItems = [];

    for (const item of items) {
        if (!mongoose.Types.ObjectId.isValid(item.product)) {
            throw new ErrorResponse(`Invalid product id: ${item.product}`, 400);
        }

        const product = await Product.findById(item.product);

        if (!product) {
            throw new ErrorResponse(`Product not found: ${item.product}`, 404);
        }

        if (product.stock < item.quantity) {
            throw new ErrorResponse(`Insufficient stock for ${product.name}`, 400);
        }

        subtotal += product.price * item.quantity;

        let imageUrl = '';
        if (product.productimages && product.productimages.length > 0) {
            const firstImage = product.productimages[0];
            imageUrl = firstImage && firstImage.url ? String(firstImage.url) : '';
        }

        orderItems.push({
            product: product._id,
            seller: product.artisan || product.createdBy || null,
            name: product.name,
            image: imageUrl,
            price: product.price,
            quantity: item.quantity,
            customization: item.customization || {},
        });

        reservedItems.push({
            product: product._id,
            quantity: item.quantity,
        });
    }

    const total = subtotal + Number(shippingCost || 0) + Number(tax || 0) - Number(discount || 0);

    return {
        reservedItems,
        orderPayload: {
            items: orderItems,
            shippingAddress: {
                ...shippingAddress,
                phone: normalizedPhone,
                email: user.email,
                country: shippingAddress.country || 'Zimbabwe',
            },
            billingAddress: billingAddress || { sameAsShipping: true },
            subtotal,
            shippingCost: Number(shippingCost || 0),
            tax: Number(tax || 0),
            discount: Number(discount || 0),
            total,
            notes,
            customerNotes: notes,
            currency: 'USD',
        },
    };
};

exports.reserveStock = async(reservedItems = []) => {
    for (const item of reservedItems) {
        const product = await Product.findOneAndUpdate(
            { _id: item.product, stock: { $gte: item.quantity } },
            { $inc: { stock: -item.quantity } },
            { new: true }
        );

        if (!product) {
            throw new ErrorResponse('One or more items are no longer available in the requested quantity', 400);
        }
    }
};

exports.releaseReservedStock = async(session) => {
    if (!session || session.stockReleased) {
        return;
    }

    for (const item of session.reservedItems || []) {
        await Product.findByIdAndUpdate(item.product, {
            $inc: { stock: item.quantity },
        });
    }

    session.stockReleased = true;
};

exports.createOrderFromSession = async(session) => {
    if (session.order) {
        const existingById = await Order.findById(session.order);
        if (existingById) {
            return existingById;
        }
    }

    const existingByReference = await Order.findOne({ paymentReference: session.reference });
    if (existingByReference) {
        session.order = existingByReference._id;
        return existingByReference;
    }

    const order = await Order.create({
        user: session.user,
        items: session.orderPayload.items,
        shippingAddress: session.orderPayload.shippingAddress,
        billingAddress: session.orderPayload.billingAddress,
        paymentMethod: 'paynow',
        paymentStatus: 'paid',
        paymentReference: session.reference,
        paymentId: session.paymentMeta?.paynowReference || session.reference,
        paymentDetails: session.paymentMeta || {},
        status: 'confirmed',
        subtotal: session.orderPayload.subtotal,
        shippingCost: session.orderPayload.shippingCost,
        tax: session.orderPayload.tax,
        discount: session.orderPayload.discount,
        total: session.orderPayload.total,
        currency: session.orderPayload.currency || 'USD',
        notes: session.orderPayload.notes,
        customerNotes: session.orderPayload.customerNotes,
    });

    for (const item of session.reservedItems || []) {
        await Product.findByIdAndUpdate(item.product, {
            $inc: { soldCount: item.quantity },
        });
    }

    session.order = order._id;

    const user = await User.findById(session.user);
    if (user) {
        await sendOrderConfirmationService(order, user);
        await sendNewOrderToSellerService(order, user);
    }

    return order;
};

exports.finalizeSessionAfterPoll = async(session, paymentStatus) => {
    const paymentState = getPaymentState(paymentStatus);

    session.paymentMeta = {
        ...session.paymentMeta,
        paynowStatus: paymentStatus?.status || null,
        pollUrl: session.pollUrl,
        paynowReference: paymentStatus?.reference || session.reference,
        paynowAmount: paymentStatus?.amount || session.orderPayload?.total,
        lastPolledAt: new Date(),
    };

    if (paymentState === 'paid') {
        session.status = 'paid';
        const order = await exports.createOrderFromSession(session);
        await session.save();
        return {
            paymentState,
            order,
        };
    }

    if (paymentState === 'cancelled' || paymentState === 'failed') {
        session.status = paymentState;
        await exports.releaseReservedStock(session);
        await session.save();
        return {
            paymentState,
            order: null,
        };
    }

    await session.save();
    return {
        paymentState,
        order: null,
    };
};
