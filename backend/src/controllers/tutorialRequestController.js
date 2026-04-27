const Enrollment = require('../models/Enrollment');
const Tutorial = require('../models/Tutorial');
const TutorialRequest = require('../models/TutorialRequest');
const asyncHandler = require('../utils/asyncHandler');
const ErrorResponse = require('../utils/errorResponse');
const withMongoTransaction = require('../utils/withMongoTransaction');
const {
    sendTutorialEnrollmentRequestEmail,
    sendTutorialRequestDecisionEmail,
} = require('../services/emailService');
const { settleTutorialApproval } = require('../services/walletService');

const ensureCustomerUser = (user) => {
    if (!user) {
        throw new ErrorResponse('Not authorized', 401);
    }

    if (user.role !== 'customer') {
        throw new ErrorResponse('Only customers can request tutorial enrollment', 403);
    }
};

const findTutorialWithArtisan = async(tutorialId) => {
    const tutorial = await Tutorial.findById(tutorialId).populate('artisanId', 'name email Cell role');

    if (!tutorial) {
        throw new ErrorResponse('Tutorial not found', 404);
    }

    return tutorial;
};

exports.requestEnrollment = asyncHandler(async(req, res) => {
    ensureCustomerUser(req.user);

    const tutorial = await findTutorialWithArtisan(req.params.id);
    const customerId = String(req.user.id);
    const tutorialId = String(tutorial._id);
    const artisanId = String(tutorial.artisanId?._id || tutorial.artisanId);

    if (artisanId === customerId) {
        throw new ErrorResponse('You cannot request enrollment for your own tutorial', 400);
    }

    const approvedEnrollment = await Enrollment.findOne({
        userId: customerId,
        tutorialId,
        status: 'APPROVED',
    });

    if (approvedEnrollment) {
        return res.status(200).json({
            success: true,
            message: 'You are already enrolled in this tutorial',
            data: {
                alreadyEnrolled: true,
                enrollment: approvedEnrollment,
            },
        });
    }

    const existingPendingRequest = await TutorialRequest.findOne({
        tutorialId,
        customerId,
        status: 'PENDING',
    }).sort('-createdAt');

    if (existingPendingRequest) {
        throw new ErrorResponse('You already have a pending enrollment request for this tutorial', 409);
    }

    const request = await TutorialRequest.create({
        tutorialId,
        customerId,
        artisanId,
        message: req.body.message || '',
        status: 'PENDING',
    });

    await sendTutorialEnrollmentRequestEmail({
        artisan: tutorial.artisanId,
        customer: req.user,
        tutorial,
        request,
    });

    res.status(201).json({
        success: true,
        message: 'Enrollment request sent to the artisan',
        data: request,
    });
});

exports.getMyTutorialRequestStatus = asyncHandler(async(req, res) => {
    const tutorial = await findTutorialWithArtisan(req.params.id);

    const enrollment = await Enrollment.findOne({
        userId: req.user.id,
        tutorialId: tutorial._id,
        status: 'APPROVED',
    });

    const request = await TutorialRequest.findOne({
        tutorialId: tutorial._id,
        customerId: req.user.id,
    }).sort('-createdAt');

    res.json({
        success: true,
        data: {
            tutorialId: tutorial._id,
            enrollment,
            request,
        },
    });
});

exports.getArtisanTutorialRequests = asyncHandler(async(req, res) => {
    const query = { artisanId: req.user.id };

    if (req.query.status) {
        query.status = String(req.query.status).toUpperCase();
    }

    const page = Math.max(1, Number(req.query.page) || 1);
    const limit = Math.min(100, Math.max(1, Number(req.query.limit) || 20));
    const skip = (page - 1) * limit;

    const total = await TutorialRequest.countDocuments(query);
    const requests = await TutorialRequest.find(query)
        .sort('-createdAt')
        .skip(skip)
        .limit(limit)
        .populate('tutorialId', 'title price createdAt')
        .populate('customerId', 'name email Cell');

    res.json({
        success: true,
        count: requests.length,
        total,
        page,
        data: requests,
    });
});

exports.respondToTutorialRequest = asyncHandler(async(req, res) => {
    const action = String(req.body.action || '').toUpperCase();
    if (!['APPROVE', 'REJECT'].includes(action)) {
        throw new ErrorResponse('Action must be APPROVE or REJECT', 400);
    }

    const request = await withMongoTransaction(async(session) => {
        const options = session ? { session } : {};
        const requestInSession = await TutorialRequest.findById(req.params.id, null, options)
            .populate('tutorialId')
            .populate('customerId', 'name email')
            .populate('artisanId', 'name email Cell');

        if (!requestInSession) {
            throw new ErrorResponse('Tutorial request not found', 404);
        }

        if (String(requestInSession.artisanId?._id || requestInSession.artisanId) !== String(req.user.id) && req.user.role !== 'admin') {
            throw new ErrorResponse('Not authorized to respond to this tutorial request', 403);
        }

        if (requestInSession.status !== 'PENDING') {
            throw new ErrorResponse('This tutorial request has already been processed', 400);
        }

        if (action === 'APPROVE') {
            requestInSession.status = 'APPROVED';

            const existingEnrollment = await Enrollment.findOne({
                userId: requestInSession.customerId._id,
                tutorialId: requestInSession.tutorialId._id,
            }, null, options);

            if (!existingEnrollment) {
                await Enrollment.create([{
                    userId: requestInSession.customerId._id,
                    tutorialId: requestInSession.tutorialId._id,
                    status: 'APPROVED',
                    progress: 0,
                    completedLessons: [],
                    completed: false,
                    enrolledAt: Date.now(),
                }], options);
            } else if (existingEnrollment.status !== 'APPROVED') {
                existingEnrollment.status = 'APPROVED';
                await existingEnrollment.save(options);
            }

            await settleTutorialApproval({
                artisanId: requestInSession.artisanId._id || requestInSession.artisanId,
                tutorial: requestInSession.tutorialId,
                tutorialRequestId: requestInSession._id,
                session,
            });
        } else {
            requestInSession.status = 'REJECTED';
        }

        requestInSession.respondedAt = new Date();
        await requestInSession.save(options);
        return requestInSession;
    });

    await sendTutorialRequestDecisionEmail({
        customer: request.customerId,
        tutorial: request.tutorialId,
        request,
    });

    res.json({
        success: true,
        message: `Tutorial request ${request.status.toLowerCase()}`,
        data: request,
    });
});
