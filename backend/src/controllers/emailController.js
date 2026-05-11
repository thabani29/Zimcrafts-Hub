// backend/src/controllers/emailController.js
const { sendTemplateEmail } = require("../utils/sendEmail");
const User = require("../models/User");
const Order = require("../models/Order");
const { buildPublicAppUrl } = require("../utils/publicUrls");

// ----------------------------------
// SEND VERIFICATION EMAIL
// ----------------------------------
exports.sendVerificationEmail = async(user, token) => {
    if (!user || !user.email || !token) {
        throw new Error("Missing user or token for verification email");
    }

    const verifyUrl = buildPublicAppUrl(`/verify-email/${token}`);

    return sendTemplateEmail("verification", user.email, {
        name: user.name,
        verifyUrl,
    });
};

// ----------------------------------
// SEND WELCOME EMAIL 
// ----------------------------------
exports.sendWelcomeEmailService = async(user) => {
    if (!user || !user.email) {
        throw new Error("Missing user data for welcome email");
    }

    return sendTemplateEmail("welcome", user.email, {
        name: user.name,
    });
};

// ----------------------------------
// SEND ORDER CONFIRMATION EMAIL 
// ----------------------------------
exports.sendOrderConfirmationService = async(order, user) => {
    if (!order || !user || !user.email) {
        throw new Error("Missing order or user data for order confirmation email");
    }

    return sendTemplateEmail("orderConfirmation", user.email, {
        order,
    });
};

// ----------------------------------
// SEND DELIVERY VERIFICATION CODE EMAIL
// ----------------------------------
exports.sendDeliveryVerificationCodeService = async(order, user, verificationCode) => {
    if (!order || !user || !user.email || !verificationCode) {
        throw new Error("Missing order, user, or code for delivery verification email");
    }

    return sendTemplateEmail("deliveryVerificationCode", user.email, {
        name: user.name,
        orderNumber: order.orderNumber,
        verificationCode,
        expiry: order.verificationCodeExpiresAt,
    });
};

// ----------------------------------
// SEND NEW ORDER EMAIL TO SELLER(S)
// ----------------------------------
exports.sendNewOrderToSellerService = async(order, customer) => {
    if (!order || !customer) {
        throw new Error("Missing order or customer data for seller notification email");
    }

    const itemsBySeller = order.items.reduce((group, item) => {
        const sellerId = item.seller ?
            String(item.seller) :
            null;
        if (!sellerId) return group;
        if (!group[sellerId]) group[sellerId] = [];
        group[sellerId].push(item);
        return group;
    }, {});

    const sellerIds = Object.keys(itemsBySeller);
    if (sellerIds.length === 0) {
        return false;
    }

    const sellers = await User.find({ _id: { $in: sellerIds } }).select('name email Cell');

    await Promise.all(sellers.map(async(seller) => {
        if (!seller.email) return;

        const sellerItems = itemsBySeller[String(seller._id)] || [];
        const customerPhone = (order.shippingAddress && order.shippingAddress.phone) ||
            customer.Cell ||
            '';

        await sendTemplateEmail("newOrderToSeller", seller.email, {
            sellerName: seller.name,
            customerName: customer.name,
            customerEmail: customer.email,
            customerPhone,
            orderNumber: order.orderNumber,
            orderTotal: order.total,
            paymentMethod: order.paymentMethod,
            shippingAddress: order.shippingAddress,
            items: sellerItems,
        });
    }));

    return true;
};

// ----------------------------------
// SEND ORDER COMPLETION REMINDER EMAILS
// ----------------------------------
exports.sendOrderCompletionReminderService = async(order) => {
    if (!order) {
        throw new Error("Missing order data for completion reminder email");
    }

    const buyer = order.user && order.user.email
        ? order.user
        : await User.findById(order.user).select('name email');

    const sellerIds = [...new Set(
        (order.items || [])
            .map((item) => item.seller ? String(item.seller) : null)
            .filter(Boolean)
    )];

    const sellers = sellerIds.length > 0
        ? await User.find({ _id: { $in: sellerIds } }).select('name email')
        : [];

    const awaitingSince = order.awaitingConfirmationStartedAt || order.updatedAt || order.createdAt;
    const verificationCode = order.verificationCode || 'your delivery verification code';
    const results = [];

    if (buyer?.email) {
        results.push(sendTemplateEmail("orderCompletionReminderBuyer", buyer.email, {
            buyerName: buyer.name,
            orderNumber: order.orderNumber,
            verificationCode,
            awaitingSince,
        }));
    }

    for (const seller of sellers) {
        if (!seller?.email) {
            continue;
        }

        results.push(sendTemplateEmail("orderCompletionReminderSeller", seller.email, {
            sellerName: seller.name,
            orderNumber: order.orderNumber,
            buyerName: buyer?.name || 'the buyer',
            awaitingSince,
        }));
    }

    if (results.length === 0) {
        return false;
    }

    const settledResults = await Promise.all(results);
    return settledResults.every(Boolean);
};

// ----------------------------------
// SEND PASSWORD RESET EMAIL 
// ----------------------------------
exports.sendPasswordResetService = async(user, resetToken) => {
    if (!user || !user.email || !resetToken) {
        throw new Error("Missing user or token for password reset email");
    }

    const resetUrl = buildPublicAppUrl(`/reset-password/${resetToken}`);

    return sendTemplateEmail("passwordReset", user.email, {
        resetUrl,
    });
};
