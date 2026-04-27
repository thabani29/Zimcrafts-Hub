const Order = require('../models/Order');
const { sendOrderCompletionReminderService } = require('../controllers/emailController');

const FIVE_DAYS_MS = 5 * 24 * 60 * 60 * 1000;
const DEFAULT_REMINDER_INTERVAL_MS = 60 * 60 * 1000;

const getReminderCutoff = () => new Date(Date.now() - FIVE_DAYS_MS);

const sendPendingCompletionReminders = async() => {
    const cutoff = getReminderCutoff();

    const orders = await Order.find({
        status: 'awaiting_confirmation',
        verificationCodeVerified: false,
        completionReminderSentAt: { $exists: false },
        $or: [{
            awaitingConfirmationStartedAt: { $lte: cutoff },
        }, {
            awaitingConfirmationStartedAt: { $exists: false },
            updatedAt: { $lte: cutoff },
        }],
    })
        .populate('user', 'name email')
        .populate('items.seller', 'name email');

    let sentCount = 0;

    for (const order of orders) {
        const sent = await sendOrderCompletionReminderService(order);

        if (!sent) {
            continue;
        }

        order.completionReminderSentAt = new Date();
        await order.save();
        sentCount += 1;
    }

    return sentCount;
};

const startOrderReminderScheduler = () => {
    const intervalMs = Number(process.env.ORDER_REMINDER_INTERVAL_MS) || DEFAULT_REMINDER_INTERVAL_MS;

    const runSweep = async() => {
        try {
            const sentCount = await sendPendingCompletionReminders();
            if (sentCount > 0) {
                console.log(`[order-reminders] Sent ${sentCount} pending completion reminder(s)`);
            }
        } catch (error) {
            console.error('[order-reminders] Failed to process completion reminders:', error.message);
        }
    };

    setTimeout(runSweep, 15 * 1000);
    return setInterval(runSweep, intervalMs);
};

module.exports = {
    FIVE_DAYS_MS,
    sendPendingCompletionReminders,
    startOrderReminderScheduler,
};
