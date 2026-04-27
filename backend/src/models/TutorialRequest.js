const mongoose = require('mongoose');

const { ObjectId } = mongoose.Schema.Types;

const tutorialRequestSchema = new mongoose.Schema({
    tutorialId: {
        type: ObjectId,
        ref: 'Tutorial',
        required: [true, 'Tutorial is required'],
        index: true,
    },
    customerId: {
        type: ObjectId,
        ref: 'User',
        required: [true, 'Customer is required'],
        index: true,
    },
    artisanId: {
        type: ObjectId,
        ref: 'User',
        required: [true, 'Artisan is required'],
        index: true,
    },
    message: {
        type: String,
        trim: true,
        maxlength: [1000, 'Request message cannot be more than 1000 characters'],
        default: '',
    },
    status: {
        type: String,
        enum: ['PENDING', 'APPROVED', 'REJECTED'],
        default: 'PENDING',
        index: true,
    },
    respondedAt: Date,
}, {
    timestamps: true,
});

tutorialRequestSchema.index({ tutorialId: 1, customerId: 1, status: 1 });

module.exports = mongoose.models.TutorialRequest || mongoose.model('TutorialRequest', tutorialRequestSchema);
