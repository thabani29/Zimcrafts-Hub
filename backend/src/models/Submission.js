const mongoose = require('mongoose');

const { ObjectId } = mongoose.Schema.Types;

const submissionAnswerSchema = new mongoose.Schema({
    questionId: String,
    questionText: String,
    userAnswer: String,
    correctAnswer: String,
    isCorrect: {
        type: Boolean,
        default: false
    },
    questionType: String
}, {
    _id: false
});

const submissionSchema = new mongoose.Schema({
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
    lessonId: {
        type: String,
        default: null // null for final exam, lesson index for lesson exams
    },
    examType: {
        type: String,
        enum: ['lesson', 'final'],
        default: 'final'
    },
    score: {
        type: Number,
        default: 0,
        min: 0,
        max: 100
    },
    totalQuestions: {
        type: Number,
        default: 0,
        min: 0
    },
    correctCount: {
        type: Number,
        default: 0,
        min: 0
    },
    passed: {
        type: Boolean,
        default: false
    },
    certificateUrl: {
        type: String,
        default: null
    },
    answers: {
        type: [submissionAnswerSchema],
        default: []
    },
    submittedAt: {
        type: Date,
        default: Date.now
    }
}, {
    timestamps: true
});

const Submission = mongoose.models.Submission || mongoose.model('Submission', submissionSchema);
module.exports = Submission;
