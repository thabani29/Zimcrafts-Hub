require('dotenv').config();
const app = require('./src/app');
const connectDB = require('./src/config/database');

// -----------------------------
// Import Routes
// -----------------------------
const authRoutes = require('./routes/auth');
const productRoutes = require('./routes/products');
const categoryRoutes = require('./routes/categories');
const orderRoutes = require('./routes/orders');
const emailRoutes = require('./routes/emailroutes');
const paymentRoutes = require('./routes/paymentRoutes');
const tutorialRoutes = require('./routes/tutorials');
const enrollRoutes = require('./routes/enroll');
const examRoutes = require('./routes/exam');
const imagekitRoutes = require('./routes/imagekit');

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
    console.log(`ZimCrafts Hub Server Started`);
    console.log(`Port: ${PORT}`);
    console.log(`Environment: ${process.env.NODE_ENV}`);
    console.log(`Database: Connected`);
    console.log('=================================');
    console.log(`API Documentation:`);
    console.log(`   • Health Check: http://localhost:${PORT}/health`);
    console.log(`   • Email Endpoints: http://localhost:${PORT}/api/v1/emails`);
    console.log(`   • Payment Endpoints: http://localhost:${PORT}/api/v1/payments`);
    console.log(`   • Auth Endpoints: http://localhost:${PORT}/api/v1/auth`);
    console.log(`   • Product Endpoints: http://localhost:${PORT}/api/v1/products`);
    console.log(`   • Order Endpoints: http://localhost:${PORT}/api/v1/orders`);
    console.log(`   • Category Endpoints: http://localhost:${PORT}/api/v1/categories`);
    console.log(`   • API Base URL: http://localhost:${PORT}/api/v1`);
    console.log('=================================');
});

// -----------------------------
// Handle Unhandled Promise Rejections
// -----------------------------
process.on('unhandledRejection', (err, promise) => {
    console.log(`Error: ${err.message}`);
    console.log(err.stack);
    server.close(() => process.exit(1));
});

// -----------------------------
// Handle SIGTERM Signal (Graceful Shutdown)
// -----------------------------
process.on('SIGTERM', () => {
    console.log(' SIGTERM received. Shutting down gracefully...');
    server.close(() => {
        console.log(' Process terminated');
    });
});