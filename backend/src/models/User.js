// backend/src/models/User.js
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const crypto = require('crypto');

const userSchema = new mongoose.Schema({
    name: {
        type: String,
        required: [true, 'Enter your name'],
        trim: true,
        maxlength: [50]
    },
    email: {
        type: String,
        required: [true, 'Enter your email'],
        unique: true,
        trim: true,
        lowercase: true,
        match: [/^\w+([\.-]?\w+)*@\w+([\.-]?\w+)*(\.\w{2,3})+$/, 'Please fill a valid email address']
    },
    password: {
        type: String,
        required: [true, 'Enter your password'],
        minlength: [8, 'The password must have a minimum of 8 characters'],
        select: false,
    },
    role: {
        type: String,
        enum: ['customer', 'admin', 'artisan/seller'],
        default: 'customer',
    },
    avatar: {
        type: String,
        default: 'default.jpg',
    },
    Cell: {
        type: String,
        required: [true, 'Phone number is required'],
        match: [/^\+?[1-9]\d{0,15}$/, 'Please fill a valid phone number']
    },
    address: {
        type: String,
        enum: ['home', 'work', 'other'],
        default: 'home',
    },
    street: String,
    city: String,
    state: String,
    country: {
        type: String,
        default: 'Zimbabwe',
    },
    zipCode: String,
    isDefault: {
        type: Boolean,
        default: true,
    },
    wishlist: [{
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Product',
    }],
    isVerified: {
        type: Boolean,
        default: false,
    },
    refreshToken: String,
    emailVerificationToken: String,
    emailVerificationExpiry: Date,
    passwordResetToken: String,
    passwordResetExpiry: Date,
}, {
    timestamps: true
});


userSchema.pre('save', async function() {

    // Only hash password if it was modified
    if (!this.isModified('password')) {
        return;
    }

    console.log('🔐 Hashing password for user:', this.email);

    const salt = await bcrypt.genSalt(10);
    this.password = await bcrypt.hash(this.password, salt);

    console.log('✅ Password hashed successfully for user:', this.email);
    console.log('Password length:', this.password.length);
});

// Compare password method
userSchema.methods.comparePassword = async function(candidatePassword) {
    try {
        return await bcrypt.compare(candidatePassword, this.password);
    } catch (error) {
        throw new Error(error);
    }
};

// Generate email verification token
userSchema.methods.generateEmailVerificationToken = function() {
    const token = crypto.randomBytes(20).toString('hex');
    this.emailVerificationToken = token; // store raw
    this.emailVerificationExpiry = Date.now() + 24 * 60 * 60 * 1000;
    return token;
};

// Generate password reset token
userSchema.methods.generatePasswordResetToken = function() {
    const resetToken = crypto.randomBytes(20).toString('hex');
    this.passwordResetToken = crypto.createHash('sha256').update(resetToken).digest('hex');
    this.passwordResetExpiry = Date.now() + 60 * 60 * 1000;
    return resetToken;
};

// IMPORTANT: Check if model exists before creating
const User = mongoose.models.User || mongoose.model('User', userSchema);

module.exports = User;