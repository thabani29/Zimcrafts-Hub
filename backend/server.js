require('dotenv').config({ path: './.env' });
const app = require('./src/app');
const connectDB = require('./src/config/database');
const { startOrderReminderScheduler } = require('./src/services/orderReminderService');

// -----------------------------
// Connect to Database
// -----------------------------
connectDB();

// -----------------------------
// Start Server
// -----------------------------
const PORT = process.env.PORT || 5000;

const server = app.listen(PORT, () => {
    console.log('=================================');
    console.log(`✅ ZimCrafts Hub Server Started`);
    console.log(`📡 Port: ${PORT}`);
    console.log(`🌍 Environment: ${process.env.NODE_ENV || 'development'}`);
    console.log(`💾 Database: Connected`);
    console.log('=================================');
    console.log(`📌 API Endpoints:`);
    console.log(`   • Health Check: http://localhost:${PORT}/health`);
    console.log(`   • Auth: http://localhost:${PORT}/api/v1/auth`);
    console.log(`   • Products: http://localhost:${PORT}/api/v1/products`);
    console.log(`   • Categories: http://localhost:${PORT}/api/v1/categories`);
    console.log(`   • Orders: http://localhost:${PORT}/api/v1/orders`);
    console.log(`   • Emails: http://localhost:${PORT}/api/v1/emails`);
    console.log(`   • Payments: http://localhost:${PORT}/api/v1/payments`);
    console.log('=================================');
});

const reminderScheduler = startOrderReminderScheduler();

// -----------------------------
// Handle Unhandled Promise Rejections
// -----------------------------
process.on('unhandledRejection', (err) => {
    console.error('❌ Unhandled Rejection:', err.message);
    console.error(err.stack);
    server.close(() => process.exit(1));
});

// -----------------------------
// Handle Uncaught Exceptions
// -----------------------------
process.on('uncaughtException', (err) => {
    console.error('❌ Uncaught Exception:', err.message);
    console.error(err.stack);
    server.close(() => process.exit(1));
});

// -----------------------------
// Handle SIGTERM Signal
// -----------------------------
process.on('SIGTERM', () => {
    console.log('👋 SIGTERM received. Shutting down gracefully...');
    clearInterval(reminderScheduler);
    server.close(() => {
        console.log('Process terminated');
    });
});
