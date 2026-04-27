const mongoose = require('mongoose');

const { ObjectId } = mongoose.Schema.Types;

const lessonProgressSchema = new mongoose.Schema({
    lessonId: {
        type: String,
        required: true
    },
    examPassed: {
        type: Boolean,
        default: false
    }
});

const enrollmentSchema = new mongoose.Schema({
    userId: {
        type: ObjectId,
        ref: 'User',
        required: [true, 'User is required']
    },
    tutorialId: {
        type: ObjectId,
        ref: 'Tutorial',
        required: [true, 'Tutorial is required']
    },
    status: {
        type: String,
        enum: ['PENDING', 'APPROVED', 'REJECTED'],
        default: 'APPROVED',
    },
    progress: {
        type: Number,
        default: 0,
        min: 0,
        max: 100
    },
    completedLessons: {
        type: [lessonProgressSchema],
        default: []
    },
    finalExamPassed: {
        type: Boolean,
        default: false
    },
    completed: {
        type: Boolean,
        default: false
    },
    paymentMethod: {
        type: String,
        enum: ['paynow'],
    },
    paymentStatus: {
        type: String,
        enum: ['paid'],
    },
    paymentReference: {
        type: String,
        unique: true,
        sparse: true,
    },
    amountPaid: {
        type: Number,
        min: 0,
    },
    paidAt: Date,
    enrolledAt: {
        type: Date,
        default: Date.now
    }
}, {
    timestamps: true
});

const Enrollment = mongoose.models.Enrollment || mongoose.model('Enrollment', enrollmentSchema);
module.exports = Enrollment;
