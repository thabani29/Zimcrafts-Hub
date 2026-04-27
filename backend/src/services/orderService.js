const mongoose = require('mongoose');
const Order = require('../models/Order');
const Product = require('../models/Product');
const ErrorResponse = require('../utils/errorResponse');
const {
    assertArtisansCanReceiveOrders,
    ensureWalletForArtisan,
    roundMoney,
} = require('./walletService');

const normalizePhone = (phone) => String(phone || '').replace(/[^\d]/g, '');
const buildSessionOptions = (session) => (session ? { session } : {});

const validateShippingAddress = (shippingAddress) => {
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

    return {
        ...shippingAddress,
        phone: normalizedPhone,
    };
};

const buildOrderContext = async({
    items = [],
    shippingAddress,
    billingAddress,
    shippingCost = 0,
    tax = 0,
    discount = 0,
    notes = '',
}, user, session = null) => {
    if (!Array.isArray(items) || items.length === 0) {
        throw new ErrorResponse('No order items provided', 400);
    }

    const normalizedShippingAddress = validateShippingAddress(shippingAddress);
    const orderItems = [];
    const artisanIds = [];
    let subtotal = 0;

    for (const item of items) {
        const productId = item?.product;
        if (!mongoose.Types.ObjectId.isValid(productId)) {
            throw new ErrorResponse(`Invalid product id: ${productId}`, 400);
        }

        const quantity = Number(item.quantity);
        if (!Number.isFinite(quantity) || quantity <= 0) {
            throw new ErrorResponse('Each order item must have a valid quantity', 400);
        }

        const product = await Product.findById(productId, null, buildSessionOptions(session));

        if (!product) {
            throw new ErrorResponse(`Product not found: ${productId}`, 404);
        }

        const sellerId = product.artisan || product.createdBy || null;
        if (!sellerId) {
            throw new ErrorResponse(`${product.name} is missing an assigned artisan`, 409);
        }

        artisanIds.push(String(sellerId));
        subtotal += (product.price || 0) * quantity;

        let imageUrl = '';
        if (product.productimages && product.productimages.length > 0) {
            const firstImage = product.productimages[0];
            imageUrl = firstImage?.url ? String(firstImage.url) : '';
        }

        orderItems.push({
            product: product._id,
            seller: sellerId,
            name: product.name,
            image: imageUrl,
            price: product.price,
            quantity,
            customization: item.customization || {},
        });
    }

    const uniqueArtisanIds = [...new Set(artisanIds)];
    for (const artisanId of uniqueArtisanIds) {
        await ensureWalletForArtisan(artisanId, session);
    }
    await assertArtisansCanReceiveOrders(uniqueArtisanIds, session);

    for (const item of orderItems) {
        const product = await Product.findOneAndUpdate(
            { _id: item.product, stock: { $gte: item.quantity } },
            { $inc: { stock: -item.quantity, soldCount: item.quantity } },
            { new: true, ...buildSessionOptions(session) }
        );

        if (!product) {
            throw new ErrorResponse('One or more items are no longer available in the requested quantity', 400);
        }
    }

    const normalizedSubtotal = roundMoney(subtotal);
    const normalizedShipping = roundMoney(shippingCost || 0);
    const normalizedTax = roundMoney(tax || 0);
    const normalizedDiscount = roundMoney(discount || 0);
    const total = roundMoney(normalizedSubtotal + normalizedShipping + normalizedTax - normalizedDiscount);

    return {
        artisanIds: uniqueArtisanIds,
        primaryArtisan: uniqueArtisanIds[0] || null,
        orderPayload: {
            user: user.id,
            artisan: uniqueArtisanIds[0] || null,
            artisanIds: uniqueArtisanIds,
            items: orderItems,
            shippingAddress: {
                ...normalizedShippingAddress,
                email: user.email,
                country: normalizedShippingAddress.country || 'Zimbabwe',
            },
            billingAddress: billingAddress || { sameAsShipping: true },
            paymentMethod: 'manual',
            paymentStatus: 'pending',
            status: 'confirmed',
            subtotal: normalizedSubtotal,
            shippingCost: normalizedShipping,
            tax: normalizedTax,
            discount: normalizedDiscount,
            total,
            currency: 'USD',
            notes,
            customerNotes: notes,
        },
    };
};

const createOrderForCustomer = async(orderInput, user, session = null) => {
    const { orderPayload } = await buildOrderContext(orderInput, user, session);
    const [order] = await Order.create([orderPayload], buildSessionOptions(session));
    return order;
};

module.exports = {
    buildOrderContext,
    createOrderForCustomer,
};
