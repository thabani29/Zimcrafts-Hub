const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const errorHandler = require('./middleware/errorHandler');
const cookieParser = require('cookie-parser');

// Import routes
const authRoutes = require('./routes/auth');
const productRoutes = require('./routes/products');
const categoryRoutes = require('./routes/categories');
const orderRoutes = require('./routes/orders');
const emailRoutes = require('./routes/emailroutes');
const paymentRoutes = require('./routes/paymentRoutes');
const walletRoutes = require('./routes/wallet');
const tutorialRoutes = require('./routes/tutorials');
const tutorialRequestRoutes = require('./routes/tutorialRequests');
const enrollRoutes = require('./routes/enroll');
const examRoutes = require('./routes/exam');
const imagekitRoutes = require('./routes/imagekit');


const app = express();

// -----------------------------
// Basic Middleware
// -----------------------------

app.use(cookieParser());
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Security Headers
app.use(helmet());

// CORS
const allowedOrigins = [...new Set(
    [
        process.env.FRONTEND_URL,
        process.env.PUBLIC_APP_URL,
        process.env.MOBILE_APP_URL,
        process.env.BASE_URL,
        process.env.BACKEND_URL,
        'https://zimcrafts.com',
        'https://www.zimcrafts.com',
        'https://api.zimcrafts.com',
        'https://zimcrafts-hub.onrender.com',
        'https://zimcrafts-hub.vercel.app',
    ]
        .filter(Boolean)
        .map((origin) => origin.replace(/\/$/, ''))
)];

const corsOptions = {
    origin: function(origin, callback) {
        // Allow requests with no origin (mobile apps, Postman, etc.)
        if (!origin || allowedOrigins.indexOf(origin) !== -1) {
            callback(null, true);
        } else {
            console.log(`[CORS] Rejected origin: ${origin}`);
            callback(null, true); // Allow for now, log in production
        }
    },
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization'],
    optionsSuccessStatus: 200,
};
app.use(cors(corsOptions));

// Request logging
app.use((req, res, next) => {
    console.log(`[${new Date().toISOString()}] ${req.method} ${req.url}`);
    next();
});

// Rate limiting
const limiter = rateLimit({
    windowMs: 15 * 60 * 1000,
    max: 100,
    message: { success: false, message: 'Too many requests' }
});
app.use('/api/', limiter);

// -----------------------------
// CUSTOM MongoDB Sanitization - FIXED VERSION
// -----------------------------
app.use((req, res, next) => {
    try {
        // Helper function to sanitize objects recursively
        const sanitizeObject = (obj) => {
            if (!obj || typeof obj !== 'object') return obj;

            // Handle arrays
            if (Array.isArray(obj)) {
                return obj.map(item => sanitizeObject(item));
            }

            // Handle objects
            const sanitized = {};
            for (const [key, value] of Object.entries(obj)) {
                // Remove keys with $ or . which are MongoDB operators
                const sanitizedKey = key.replace(/[$.]/g, '_');

                if (typeof value === 'object' && value !== null) {
                    sanitized[sanitizedKey] = sanitizeObject(value);
                } else {
                    sanitized[sanitizedKey] = value;
                }
            }
            return sanitized;
        };

        // Safely sanitize body
        if (req.body && typeof req.body === 'object') {
            req.body = sanitizeObject(req.body);
        }

        // For query and params, we need to be more careful
        // Instead of modifying req.query directly, we'll create a new object
        if (req.query && Object.keys(req.query).length > 0) {
            const sanitizedQuery = sanitizeObject({...req.query });
            // Clear and reassign
            Object.keys(req.query).forEach(key => delete req.query[key]);
            Object.assign(req.query, sanitizedQuery);
        }

        if (req.params && Object.keys(req.params).length > 0) {
            const sanitizedParams = sanitizeObject({...req.params });
            Object.keys(req.params).forEach(key => delete req.params[key]);
            Object.assign(req.params, sanitizedParams);
        }

        next();
    } catch (error) {
        console.error('Sanitization error:', error);
        next(error);
    }
});

// -----------------------------
// Test Routes
// -----------------------------
app.get('/test', (req, res) => {
    res.json({ message: 'Server is working!' });
});

app.get('/health', (req, res) => {
    res.json({
        success: true,
        message: 'ZimCrafts Hub API is running',
        timestamp: new Date().toISOString(),
        uptime: process.uptime()
    });
});

// Test registration endpoint (for debugging)
app.post('/api/v1/auth/test-register', (req, res) => {
    console.log('Test registration received:', req.body);
    res.json({
        success: true,
        message: 'Test endpoint working',
        receivedData: req.body
    });
});

// -----------------------------
// API Routes
// -----------------------------
app.use('/api/v1/auth', authRoutes);
app.use('/api/v1/products', productRoutes);
app.use('/api/v1/categories', categoryRoutes);
app.use('/api/v1/orders', orderRoutes);
app.use('/api/v1/emails', emailRoutes);
app.use('/api/v1/payments', paymentRoutes);
app.use('/api/v1/wallet', walletRoutes);
app.use('/api/v1/tutorials', tutorialRoutes);
app.use('/api/v1/tutorial-requests', tutorialRequestRoutes);
app.use('/api/v1/enroll', enrollRoutes);
app.use('/api/v1/exam', examRoutes);
app.use('/api/imagekit-auth', imagekitRoutes);

// -----------------------------
// 404 Handler
// -----------------------------
app.use((req, res) => {
    res.status(404).json({
        success: false,
        message: `Route ${req.originalUrl} not found`
    });
});

// -----------------------------
// Error Handler
// -----------------------------
app.use(errorHandler);

module.exports = app;
