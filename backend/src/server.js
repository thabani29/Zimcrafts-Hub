require('dotenv').config();
const app = require('./src/app');
const connectDB = require('./src/config/database');
const { startOrderReminderScheduler } = require('./src/services/orderReminderService');
const { getBackendBaseUrl } = require('./src/utils/publicUrls');

const PORT = process.env.PORT || 5000;
const BASE_URL = getBackendBaseUrl();

let server;
let reminderScheduler;

// Connect DB first
connectDB()
    .then(() => {
        server = app.listen(PORT, "0.0.0.0", () => {
            console.log('=================================');
            console.log(`✅ ZimCrafts Hub Server Started`);
            console.log(`📡 Port: ${PORT}`);
            console.log(`🌍 Environment: ${process.env.NODE_ENV || 'development'}`);
            console.log(`💾 Database: Connected`);
            console.log('=================================');
            console.log(`📌 API Endpoints:`);
            console.log(`   • Health: ${BASE_URL}/health`);
            console.log(`   • Auth: ${BASE_URL}/api/v1/auth`);
            console.log(`   • Products: ${BASE_URL}/api/v1/products`);
            console.log(`=================================`);
        });

        if (process.env.ENABLE_SCHEDULER === "true") {
            reminderScheduler = startOrderReminderScheduler();
        }
    })
    .catch((err) => {
        console.error("❌ Database connection failed:", err);
        process.exit(1);
    });

// Graceful shutdown
process.on('SIGTERM', () => {
    console.log('👋 SIGTERM received. Shutting down...');
    if (reminderScheduler) clearInterval(reminderScheduler);
    if (server) {
        server.close(() => console.log('Process terminated'));
    }
});
