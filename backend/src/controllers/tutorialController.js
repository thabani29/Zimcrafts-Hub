const Tutorial = require('../models/Tutorial');
const asyncHandler = require('../utils/asyncHandler');
const ErrorResponse = require('../utils/errorResponse');
const imagekit = require('../services/imagekitService');

// @desc    Create a new tutorial/course
// @route   POST /api/v1/tutorials
// @access  Private (artisan)
exports.createTutorial = asyncHandler(async(req, res, next) => {
    const { title, description, price, category, lessons, exam } = req.body;

    if (!title || !description || typeof price === 'undefined') {
        return next(new ErrorResponse('Title, description and price are required', 400));
    }

    const parsedLessons = typeof lessons === 'string' ? JSON.parse(lessons || '[]') : lessons || [];
    const parsedExam = typeof exam === 'string' ? JSON.parse(exam || '{}') : exam || {};

    const tutorial = await Tutorial.create({
        title,
        description,
        price,
        category,
        artisanId: req.user.id,
        lessons: parsedLessons,
        exam: parsedExam
    });

    res.status(201).json({
        success: true,
        data: tutorial
    });
});

// @desc    Get all tutorials
// @route   GET /api/v1/tutorials
// @access  Public
exports.getTutorials = asyncHandler(async(req, res, next) => {
    const reqQuery = {...req.query };
    const removeFields = ['select', 'sort', 'page', 'limit', 'search'];
    removeFields.forEach(param => delete reqQuery[param]);

    let queryStr = JSON.stringify(reqQuery);
    queryStr = queryStr.replace(/\b(gt|gte|lt|lte|in)\b/g, match => `$${match}`);

    let query = Tutorial.find(JSON.parse(queryStr)).populate('artisanId', 'name avatar email Cell').populate('category', 'name slug');

    console.log('Tutorial query params:', req.query);
    console.log('Tutorial filter object:', JSON.parse(queryStr));

    if (req.query.search) {
        query = query.find({
            $or: [
                { title: { $regex: req.query.search, $options: 'i' } },
                { description: { $regex: req.query.search, $options: 'i' } }
            ]
        });
    }

    if (req.query.sort) {
        const sortBy = req.query.sort.split(',').join(' ');
        query = query.sort(sortBy);
    } else {
        query = query.sort('-createdAt');
    }

    const page = parseInt(req.query.page, 10) || 1;
    const limit = parseInt(req.query.limit, 10) || 20;
    const startIndex = (page - 1) * limit;
    const total = await Tutorial.countDocuments(JSON.parse(queryStr));
    query = query.skip(startIndex).limit(limit);

    const tutorials = await query;

    console.log('Total tutorials found:', total);
    console.log('Tutorials returned:', tutorials.length);

    const pagination = {};
    if (startIndex + limit < total) {
        pagination.next = { page: page + 1, limit };
    }
    if (startIndex > 0) {
        pagination.prev = { page: page - 1, limit };
    }

    res.json({
        success: true,
        count: tutorials.length,
        pagination,
        total,
        data: tutorials
    });
});

// @desc    Get single tutorial
// @route   GET /api/v1/tutorials/:id
// @access  Public
exports.getTutorial = asyncHandler(async(req, res, next) => {
    const tutorial = await Tutorial.findById(req.params.id).populate('artisanId', 'name avatar email Cell').populate('category', 'name slug');

    if (!tutorial) {
        return next(new ErrorResponse(`Tutorial not found with id of ${req.params.id}`, 404));
    }

    res.json({
        success: true,
        data: tutorial
    });
});

// @desc    Get tutorials created by the logged in artisan
// @route   GET /api/v1/tutorials/my-tutorials
// @access  Private (artisan)
exports.getMyTutorials = asyncHandler(async(req, res, next) => {
    const tutorials = await Tutorial.find({ artisanId: req.user.id }).sort('-createdAt');

    res.json({
        success: true,
        count: tutorials.length,
        data: tutorials
    });
});

// @desc    Update tutorial
// @route   PUT /api/v1/tutorials/:id
// @access  Private (artisan)
exports.updateTutorial = asyncHandler(async(req, res, next) => {
    const tutorial = await Tutorial.findById(req.params.id);
    if (!tutorial) {
        return next(new ErrorResponse(`Tutorial not found with id of ${req.params.id}`, 404));
    }

    if (tutorial.artisanId.toString() !== req.user.id && req.user.role !== 'admin') {
        return next(new ErrorResponse('Not authorized to update this tutorial', 403));
    }

    const updatedData = {
        title: req.body.title || tutorial.title,
        description: req.body.description || tutorial.description,
        price: typeof req.body.price !== 'undefined' ? req.body.price : tutorial.price,
        category: typeof req.body.category !== 'undefined' ? req.body.category : tutorial.category,
        lessons: typeof req.body.lessons !== 'undefined' ? req.body.lessons : tutorial.lessons,
        exam: typeof req.body.exam !== 'undefined' ? req.body.exam : tutorial.exam
    };

    const updatedTutorial = await Tutorial.findByIdAndUpdate(req.params.id, updatedData, {
        new: true,
        runValidators: true
    });

    res.json({
        success: true,
        data: updatedTutorial
    });
});

// @desc    Delete a tutorial
// @route   DELETE /api/v1/tutorials/:id
// @access  Private (artisan)
exports.deleteTutorial = asyncHandler(async(req, res, next) => {
    const tutorial = await Tutorial.findById(req.params.id);
    if (!tutorial) {
        return next(new ErrorResponse(`Tutorial not found with id of ${req.params.id}`, 404));
    }

    if (tutorial.artisanId.toString() !== req.user.id && req.user.role !== 'admin') {
        return next(new ErrorResponse('Not authorized to delete this tutorial', 403));
    }

    await Tutorial.findByIdAndDelete(req.params.id);

    res.json({
        success: true,
        message: 'Tutorial removed'
    });
});

// @desc    Upload a tutorial video to ImageKit and return the URL
// @route   POST /api/v1/tutorials/upload-video
// @access  Private (artisan)
exports.uploadVideo = asyncHandler(async(req, res, next) => {
    if (!req.file) {
        return next(new ErrorResponse('Video file is required', 400));
    }

    const fileBuffer = req.file.buffer;
    const fileBase64 = fileBuffer.toString('base64');
    const filename = `tutorial_video_${Date.now()}_${req.file.originalname}`;

    const response = await imagekit.upload({
        file: fileBase64,
        fileName: filename,
        folder: '/tutorial-videos'
    });

    res.status(201).json({
        success: true,
        data: {
            url: response.url,
            fileId: response.fileId
        }
    });
});
