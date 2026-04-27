// src/utils/sendEmail.js

const SibApiV3Sdk = require('sib-api-v3-sdk');

// -------------------------
// BREVO CONFIG (FIXED)
// -------------------------
const client = SibApiV3Sdk.ApiClient.instance;
const apiKey = client.authentications['api-key'];

apiKey.apiKey = process.env.BREVO_API_KEY;

const transacApi = new SibApiV3Sdk.TransactionalEmailsApi();

// -------------------------
// VALIDATE EMAIL
// -------------------------
const isValidEmail = (email) =>
    /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);

// -------------------------
// SEND EMAIL CORE FUNCTION
// -------------------------
const sendEmail = async({ to, subject, html, text }, retryCount = 0) => {
    if (!to || !subject || !html) {
        console.error("❌ Missing email parameters");
        return false;
    }

    if (!isValidEmail(to)) {
        console.error(`❌ Invalid email: ${to}`);
        return false;
    }

    try {
        const response = await transacApi.sendTransacEmail({
            sender: {
                name: "ZimCrafts Hub",
                email: process.env.EMAIL_FROM,
            },
            to: [{ email: to }],
            subject,
            htmlContent: html,
            ...(text && { textContent: text }),
        });

        console.log(`✅ Email sent to ${to}`, response.messageId);
        return true;

    } catch (error) {
        console.error("❌ Email error:", error.response && error.response.body || error.message);

        // Retry once
        if (retryCount < 1) {
            console.log("🔁 Retrying...");
            return sendEmail({ to, subject, html, text }, retryCount + 1);
        }

        return false;
    }
};

// -------------------------
// EMAIL TEMPLATES (IMPROVED UI)
// -------------------------
const emailTemplates = {
        verification: ({ name, verifyUrl }) => ({
            subject: "Verify your email - ZimCrafts Hub",
            html: `
        <div style="font-family: Arial; padding:20px;">
            <h2>Welcome ${name} 👋</h2>
            <p>Please verify your email to activate your account.</p>
            <a href="${verifyUrl}" 
               style="display:inline-block;padding:12px 20px;background:#2c7be5;color:#fff;text-decoration:none;border-radius:5px;">
               Verify Email
            </a>
            <p style="margin-top:20px;">If you didn’t create this account, ignore this email.</p>
        </div>
        `,
        }),

        welcome: ({ name }) => ({
            subject: "Welcome to ZimCrafts Hub 🎉",
            html: `
        <div style="font-family: Arial; padding:20px;">
            <h2>Welcome ${name} 🎉</h2>
            <p>Your account has been successfully verified.</p>
            <p>Start exploring amazing handmade products now.</p>
        </div>
        `,
        }),

        orderConfirmation: ({ order }) => ({
            subject: `Order Confirmed ✅ #${order.orderNumber}`,
            html: `
        <div style="font-family: Arial; padding:20px;">
            <h2>Order Confirmed ✅</h2>
            <p><strong>Order Number:</strong> ${order.orderNumber}</p>
            <p><strong>Total:</strong> $${order.total}</p>
            <p>Thank you for shopping with ZimCrafts Hub!</p>
        </div>
        `,
        }),

        deliveryVerificationCode: ({ name, orderNumber, verificationCode, expiry }) => ({
                    subject: `Delivery confirmation code for order #${orderNumber}`,
                    html: `
        <div style="font-family: Arial; padding:20px;">
            <h2>Hello ${name || 'Customer'},</h2>
            <p>Your seller has marked order <strong>#${orderNumber}</strong> as complete.</p>
            <p>Please enter the verification code below to confirm delivery and complete the order.</p>
            <div style="margin:20px 0; padding:16px; background:#f3f4f6; border-radius:8px; font-size:24px; font-weight:700; letter-spacing:0.2em; text-align:center;">
                ${verificationCode}
            </div>
            ${expiry ? `<p style="color:#475569;">This code expires on ${new Date(expiry).toLocaleString()}.</p>` : ''}
            <p>If you did not expect this email, please contact the seller.</p>
        </div>
        `,
        }),

        newOrderToSeller: ({ sellerName, customerName, customerEmail, customerPhone, orderNumber, orderTotal, paymentMethod, shippingAddress, items }) => ({
                    subject: `New order received ✅ #${orderNumber}`,
                    html: `
        <div style="font-family: Arial; padding:20px;">
            <h2>Hello ${sellerName},</h2>
            <p>You have a new order from <strong>${customerName}</strong>.</p>
            <p><strong>Order Number:</strong> ${orderNumber}</p>
            <p><strong>Total:</strong> $${orderTotal}</p>
            <p><strong>Payment Method:</strong> ${paymentMethod}</p>
            <p><strong>Customer Email:</strong> ${customerEmail}</p>
            <p><strong>Customer Phone:</strong> ${customerPhone || 'Not provided'}</p>
            <h3 style="margin-top:24px;">Shipping Address</h3>
            <p>
                ${shippingAddress.name || ''}<br />
                ${shippingAddress.street || ''}<br />
                ${shippingAddress.city || ''}, ${shippingAddress.state || ''}<br />
                ${shippingAddress.country || ''} ${shippingAddress.zipCode || ''}
            </p>
            <h3 style="margin-top:24px;">Order Items</h3>
            ${items.map(item => `
                <div style="border:1px solid #eee; padding:12px; margin-bottom:16px; display:flex; gap:12px; align-items:flex-start;">
                    <div style="min-width:120px; max-width:120px;">
                        <img src="${item.image || ''}" alt="${item.name}" style="width:100%; height:auto; border-radius:6px; object-fit:cover;" />
                    </div>
                    <div style="flex:1;">
                        <p style="margin:0 0 6px 0;"><strong>${item.name}</strong></p>
                        <p style="margin:0 0 4px 0;">Quantity: ${item.quantity}</p>
                        <p style="margin:0 0 4px 0;">Price: $${item.price}</p>
                        <p style="margin:0;">Subtotal: $${(item.price * item.quantity).toFixed(2)}</p>
                    </div>
                </div>
            `).join('')}
            <p style="margin-top:24px;">Please prepare this order for fulfilment and update the status as appropriate.</p>
            <p>Thanks,<br/>ZimCrafts Hub</p>
        </div>
        `,
    }),

    orderCompletionReminderBuyer: ({ buyerName, orderNumber, verificationCode, awaitingSince }) => ({
        subject: `Reminder: confirm completion for order #${orderNumber}`,
        html: `
        <div style="font-family: Arial; padding:20px;">
            <h2>Hello ${buyerName || 'Customer'},</h2>
            <p>Your order <strong>#${orderNumber}</strong> has been waiting for delivery confirmation since ${awaitingSince ? new Date(awaitingSince).toLocaleString() : 'a few days ago'}.</p>
            <p>Please enter the verification code in the app or website so the order can be marked as completed.</p>
            <div style="margin:20px 0; padding:16px; background:#f3f4f6; border-radius:8px; font-size:24px; font-weight:700; letter-spacing:0.2em; text-align:center;">
                ${verificationCode}
            </div>
            <p>If you have already completed this step, you can ignore this email.</p>
        </div>
        `,
    }),

    orderCompletionReminderSeller: ({ sellerName, orderNumber, buyerName, awaitingSince }) => ({
        subject: `Reminder: buyer confirmation pending for order #${orderNumber}`,
        html: `
        <div style="font-family: Arial; padding:20px;">
            <h2>Hello ${sellerName || 'Artisan'},</h2>
            <p>Order <strong>#${orderNumber}</strong> for ${buyerName || 'your buyer'} has remained in awaiting confirmation status since ${awaitingSince ? new Date(awaitingSince).toLocaleString() : 'a few days ago'}.</p>
            <p>Please remind the buyer to enter the verification code so the order can move to completed and the wallet settlement can be finalized.</p>
            <p>If the buyer has already confirmed delivery, you can ignore this message.</p>
        </div>
        `,
    }),

    passwordReset: ({ resetUrl }) => ({
        subject: "Reset your password",
        html: `
        <div style="font-family: Arial; padding:20px;">
            <h2>Password Reset</h2>
            <p>Click below to reset your password:</p>
            <a href="${resetUrl}" 
               style="display:inline-block;padding:12px 20px;background:#e5533d;color:#fff;text-decoration:none;border-radius:5px;">
               Reset Password
            </a>
        </div>
        `,
    }),
};

// -------------------------
// TEMPLATE SENDER
// -------------------------
const sendTemplateEmail = async(type, to, data) => {
    const template = emailTemplates[type];

    if (!template) {
        console.error(`❌ Template ${type} not found`);
        return false;
    }

    const { subject, html, text } = template(data);

    return sendEmail({ to, subject, html, text });
};

module.exports = {
    sendEmail,
    sendTemplateEmail,
};
