const mongoose = require('mongoose');
const productSchema = new mongoose.Schema({
    name: {
        type: String,
        required: [true, 'enter the product Name'],
        trim: true,
        maxlength: 150,
    },
    slug: {
        type: String,
        unique: true,
        lowercase: true,
        index: true,
    },
    description: {
        type: String,
        required: [true, 'Describe your product here'],
        maxlength: 3000,
    },
    shortDescription: {
        type: String,
        maxlenth: 400,
    },
    price: {
        type: Number,
        required: [true, 'Enter the product price'],
        min: 0,
    },
    category: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Category',
        required: [true, 'Select you product category']
    },
    artisan: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User'
    },
    artisanbio: {
        name: String,
        location: String,
        story: String,
        yearsOfExperience: Number,
    },
    productimages: [{
        url: String,
        fileId: String,
        altText: String,
        isPrimary: {
            type: Boolean,
            default: false
        }

    }],
    stock: {
        type: Number,
        required: true,
        min: 0,
        default: 0,
    },
    soldCount: {
        type: Number,
        default: 0,
        min: 0
    },
    materials: {
        type: String,
        lowercase: true
    },
    colors: [{
        type: String,
        lowercase: true,
    }],
    dimensions: {
        length: { type: Number, min: 0 },
        width: { type: Number, min: 0 },
        height: { type: Number, min: 0 },
        weight: { type: Number, min: 0 },
        unit: {
            type: String,
            enum: ['cm', 'inches'],
            default: 'cm'
        }
    },
    isHandmade: {
        type: Boolean,
        default: true
    },
    isEcoFriendly: {
        type: Boolean,
        default: false
    },
    isCustomizable: {
        type: Boolean,
        default: false
    },
    customizationOptions: [{
        name: String,
        type: {
            type: String,
            enum: ['text', 'color', 'dropdown', 'checkbox']
        },
        options: [String],
        required: Boolean,
        additionalCost: Number
    }],
    ratings: {
        average: {
            type: Number,
            default: 0,
            min: 0,
            max: 5,
            set: v => Math.round(v * 10) / 10
        },
        count: {
            type: Number,
            default: 0
        }
    },
    reviews: [{
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Review'
    }],
    isFeatured: {
        type: Boolean,
        default: false
    },
    isBestSeller: {
        type: Boolean,
        default: false
    },
    isNewArrival: {
        type: Boolean,
        default: true
    },
    seo: {
        title: String,
        description: String,
        keywords: [String]
    },
    status: {
        type: String,
        enum: ['draft', 'active', 'out_of_stock', 'discontinued'],
        default: 'draft'
    },
    createdBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User'
    },
    createdAt: {
        type: Date,
        default: Date.now
    },
    updatedAt: {
        type: Date,
        default: Date.now
    }
}, {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true }
});

// Generate slug before saving
productSchema.pre('save', function() {
    if (!this.slug && this.name) {
        this.slug = this.name
            .toLowerCase()
            .replace(/[^a-z0-9\s-]/g, '')
            .replace(/\s+/g, '-')
            .replace(/-+/g, '-')
            .trim();
    }
});

// Check if product is in stock
productSchema.virtual('inStock').get(function() {
    return this.stock > 0;
});

// Calculate discount percentage
productSchema.virtual('discountPercentage').get(function() {
    if (!this.comparePrice || this.comparePrice <= this.price) return 0;
    return Math.round(((this.comparePrice - this.price) / this.comparePrice) * 100);
});

// Index for search
productSchema.index({ name: 'text', description: 'text', tags: 'text' });
productSchema.index({ category: 1, price: 1 });
productSchema.index({ isFeatured: 1, isBestSeller: 1, isNewArrival: 1 });

module.exports = mongoose.model('Product', productSchema);