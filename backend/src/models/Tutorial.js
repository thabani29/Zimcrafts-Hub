const mongoose = require('mongoose');

const { ObjectId } = mongoose.Schema.Types;

const questionSchema = new mongoose.Schema({
    questionText: {
        type: String,
        required: [true, 'Question text is required']
    },
    type: {
        type: String,
        enum: ['mcq', 'short'],
        default: 'mcq'
    },
    options: {
        type: [String],
        default: []
    },
    correctAnswer: {
        type: String,
        required: [true, 'Correct answer is required']
    }
});

const lessonSchema = new mongoose.Schema({
    title: {
        type: String,
        required: [true, 'Lesson title is required']
    },
    type: {
        type: String,
        enum: ['video', 'text'],
        default: 'text'
    },
    contentUrl: {
        type: String,
        required: [true, 'Lesson content URL or text is required']
    },
    duration: {
        type: Number,
        default: 0,
        min: [0, 'Duration must be a positive number']
    },
    exam: {
        questions: {
            type: [questionSchema],
            default: []
        }
    }
});

const tutorialSchema = new mongoose.Schema({
    title: {
        type: String,
        required: [true, 'Title is required'],
        trim: true,
        maxlength: [150, 'Title cannot be more than 150 characters']
    },
    description: {
        type: String,
        required: [true, 'Description is required'],
        trim: true,
        maxlength: [2000, 'Description cannot be more than 2000 characters']
    },
    price: {
        type: Number,
        required: [true, 'Price is required'],
        min: [0, 'Price must be greater than or equal to 0']
    },
    category: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Category',
        default: null
    },
    artisanId: {
        type: ObjectId,
        ref: 'User',
        required: [true, 'Artisan is required']
    },
    lessons: {
        type: [lessonSchema],
        default: []
    },
    exam: {
        questions: {
            type: [questionSchema],
            default: []
        }
    }
}, {
    timestamps: true
});

const Tutorial = mongoose.models.Tutorial || mongoose.model('Tutorial', tutorialSchema);
module.exports = Tutorial;