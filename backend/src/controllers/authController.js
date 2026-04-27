// backend/src/controllers/authController.js
const crypto = require('crypto');
const jwt = require('jsonwebtoken');
const User = require('../models/User');
const ErrorResponse = require('../utils/errorResponse');
const {
    sendVerificationEmail,
    sendWelcomeEmailService,
    sendPasswordResetService,
} = require('./emailController');

// ---------------------
// JWT HELPERS
// ---------------------
const createAccessToken = (userId) =>
    jwt.sign({ id: userId }, process.env.JWT_SECRET, {
        expiresIn: process.env.JWT_EXPIRE || '15m',
    });

const createRefreshToken = (userId) =>
    jwt.sign({ id: userId }, process.env.JWT_REFRESH_SECRET, {
        expiresIn: process.env.JWT_REFRESH_EXPIRE || '7d',
    });

// ---------------------
// COOKIE OPTIONS
// ---------------------
const cookieOptions = {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: process.env.NODE_ENV === 'production' ? 'None' : 'Lax',
    path: '/',
};

const accessTokenOptions = {
    ...cookieOptions,
    maxAge: 15 * 60 * 1000, // 15 min
};

const refreshTokenOptions = {
    ...cookieOptions,
    maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
};

// ---------------------
// REGISTER
// ---------------------
exports.register = async(req, res, next) => {
    try {
        const {
            name,
            email,
            password,
            role,
            Cell,
            address,
            street,
            city,
            state,
            country,
            zipCode,
        } = req.body;

        if (!Cell) return next(new ErrorResponse('Cell phone number is required', 400));

        const existingUser = await User.findOne({ email });
        if (existingUser) return next(new ErrorResponse('User already exists', 400));

        const user = await User.create({
            name,
            email,
            password,
            role: role || 'customer',
            Cell,
            address: address || 'home',
            street,
            city,
            state,
            country: country || 'Zimbabwe',
            zipCode,
            isVerified: false,
        });

        // Generate raw verification token and store raw token in DB
        const verifyToken = user.generateEmailVerificationToken();
        await user.save({ validateBeforeSave: false });

        console.log("Verification token:", verifyToken);
        console.log("Token expiry:", user.emailVerificationExpiry);

        await sendVerificationEmail(user, verifyToken);

        res.status(201).json({
            success: true,
            message: 'Registration successful. Please verify your email.',
        });
    } catch (error) {
        next(error);
    }
};

// ---------------------
// LOGIN
// ---------------------
exports.login = async(req, res, next) => {
    try {
        const { email, password } = req.body;
        if (!email || !password) return next(new ErrorResponse('Provide email and password', 400));

        const user = await User.findOne({ email }).select('+password');
        if (!user || !(await user.comparePassword(password))) {
            return next(new ErrorResponse('Invalid credentials', 401));
        }

        if (!user.isVerified) return next(new ErrorResponse('Please verify your email first', 401));

        const accessToken = createAccessToken(user._id);
        const refreshToken = createRefreshToken(user._id);

        res.cookie('accessToken', accessToken, accessTokenOptions);
        res.cookie('refreshToken', refreshToken, refreshTokenOptions);

        res.json({ success: true, user, accessToken });
    } catch (error) {
        next(error);
    }
};

// ---------------------
// VERIFY EMAIL
// ---------------------
exports.verifyEmail = async(req, res, next) => {
    try {
        const token = req.params.token;
        console.log("Token from frontend/email:", token);

        // Use raw token
        const user = await User.findOne({
            emailVerificationToken: token,
            emailVerificationExpiry: { $gt: Date.now() },
        });

        if (!user) return next(new ErrorResponse('Invalid or expired token', 400));

        user.isVerified = true;
        user.emailVerificationToken = undefined;
        user.emailVerificationExpiry = undefined;
        await user.save();

        await sendWelcomeEmailService(user);

        res.json({ success: true, message: 'Email verified successfully' });
    } catch (error) {
        next(error);
    }
};

// ---------------------
// RESEND VERIFICATION EMAIL
// ---------------------
exports.resendVerification = async(req, res, next) => {
    try {
        const { email } = req.body;
        if (!email) return next(new ErrorResponse('Email is required', 400));

        const user = await User.findOne({ email });
        if (!user) return next(new ErrorResponse('User not found', 404));
        if (user.isVerified) return next(new ErrorResponse('Email already verified', 400));

        const token = user.generateEmailVerificationToken(); // raw token
        await user.save({ validateBeforeSave: false });

        console.log("Resent verification token:", token);
        console.log("Token expiry:", user.emailVerificationExpiry);

        await sendVerificationEmail(user, token);

        res.json({ success: true, message: 'Verification email resent' });
    } catch (error) {
        next(error);
    }
};

// ---------------------
// FORGOT PASSWORD
// ---------------------
exports.forgotPassword = async(req, res, next) => {
    try {
        const user = await User.findOne({ email: req.body.email });
        if (!user) return next(new ErrorResponse('User not found', 404));

        const resetToken = user.generatePasswordResetToken();
        await user.save({ validateBeforeSave: false });

        await sendPasswordResetService(user, resetToken);

        res.json({ success: true, message: 'Password reset email sent' });
    } catch (error) {
        next(error);
    }
};

// ---------------------
// RESET PASSWORD
// ---------------------
exports.resetPassword = async(req, res, next) => {
    try {
        const hashedToken = crypto.createHash('sha256').update(req.params.resettoken).digest('hex');

        const user = await User.findOne({
            passwordResetToken: hashedToken,
            passwordResetExpiry: { $gt: Date.now() },
        });

        if (!user) return next(new ErrorResponse('Invalid or expired token', 400));

        user.password = req.body.password;
        user.passwordResetToken = undefined;
        user.passwordResetExpiry = undefined;
        await user.save();

        const accessToken = createAccessToken(user._id);
        const refreshToken = createRefreshToken(user._id);
        res.cookie('accessToken', accessToken, accessTokenOptions);
        res.cookie('refreshToken', refreshToken, refreshTokenOptions);

        res.json({ success: true, accessToken });
    } catch (error) {
        next(error);
    }
};

// ---------------------
// GET CURRENT USER
// ---------------------
exports.getMe = async(req, res, next) => {
    try {
        const user = await User.findById(req.user._id);
        res.json({ success: true, user });
    } catch (error) {
        next(error);
    }
};

// ---------------------
// LOGOUT
// ---------------------
exports.logout = async(req, res) => {
    res.cookie('accessToken', '', {...accessTokenOptions, maxAge: 0 });
    res.cookie('refreshToken', '', {...refreshTokenOptions, maxAge: 0 });
    res.json({ success: true, message: 'Logged out' });
};