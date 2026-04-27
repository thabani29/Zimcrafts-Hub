const Enrollment = require('../models/Enrollment');
const Tutorial = require('../models/Tutorial');
const TutorialPaymentSession = require('../models/TutorialPaymentSession');
const asyncHandler = require('../utils/asyncHandler');
const ErrorResponse = require('../utils/errorResponse');
const createPaynowClient = require('../config/paynow');

const normalizeCompletedLessons = (enrollment) => {
    if (!enrollment) {
        return [];
    }

    const normalizedLessons = Array.isArray(enrollment.completedLessons)
        ? enrollment.completedLessons
              .map((entry) => {
                  if (!entry) {
                      return null;
                  }

                  if (typeof entry === 'string') {
                      return {
                          lessonId: entry,
                          examPassed: true,
                      };
                  }

                  if (entry.lessonId) {
                      return {
                          lessonId: entry.lessonId.toString(),
                          examPassed: Boolean(entry.examPassed),
                      };
                  }

                  return null;
              })
              .filter(Boolean)
        : [];

    enrollment.completedLessons = normalizedLessons;
    return normalizedLessons;
};

const hasPassedLessonExam = (enrollment, lessonId) =>
    Boolean(
        normalizeCompletedLessons(enrollment).find(
            (cl) => cl.lessonId === lessonId && cl.examPassed
        )
    );

const getPaynowState = (paymentStatus) => {
    const statusText = String(paymentStatus?.status || '').toLowerCase();

    if (typeof paymentStatus?.paid === 'function' && paymentStatus.paid()) {
        return 'paid';
    }

    if (statusText === 'paid' || statusText === 'awaiting delivery' || statusText === 'delivered') {
        return 'paid';
    }

    if (statusText === 'cancelled') {
        return 'cancelled';
    }

    if (statusText === 'failed' || statusText === 'error') {
        return 'failed';
    }

    return 'pending';
};

const buildFrontendUrl = (path) => {
    const baseUrl = process.env.FRONTEND_URL || 'http://localhost:3000';
    return `${baseUrl.replace(/\/$/, '')}${path}`;
};

const buildApiUrl = (path) => {
    const backendBase = process.env.BACKEND_URL || `http://localhost:${process.env.PORT || 5000}`;
    return `${backendBase.replace(/\/$/, '')}${path}`;
};

const hasValidPaynowConfig = () => {
    const integrationId = String(process.env.PAYNOW_INTEGRATION_ID || '').trim();
    const integrationKey = String(process.env.PAYNOW_INTEGRATION_KEY || '').trim();

    return Boolean(
        integrationId &&
        integrationKey &&
        integrationId !== 'your_paynow_integration_id' &&
        integrationKey !== 'your_paynow_integration_key'
    );
};

const findTutorialForPurchase = async(tutorialId) => {
    const tutorial = await Tutorial.findById(tutorialId);

    if (!tutorial) {
        throw new ErrorResponse('Tutorial not found', 404);
    }

    return tutorial;
};

const createPaidEnrollmentFromSession = async(session) => {
    if (session.enrollmentId) {
        const existingEnrollment = await Enrollment.findById(session.enrollmentId);
        if (existingEnrollment) {
            return existingEnrollment;
        }
    }

    let enrollment = await Enrollment.findOne({
        userId: session.userId,
        tutorialId: session.tutorialId,
    });

    if (enrollment) {
        session.enrollmentId = enrollment._id;
        return enrollment;
    }

    enrollment = await Enrollment.create({
        userId: session.userId,
        tutorialId: session.tutorialId,
        status: 'APPROVED',
        progress: 0,
        completedLessons: [],
        completed: false,
        paymentMethod: 'paynow',
        paymentStatus: 'paid',
        paymentReference: session.reference,
        amountPaid: session.amount,
        paidAt: new Date(),
        enrolledAt: Date.now(),
    });

    session.enrollmentId = enrollment._id;
    return enrollment;
};

const finalizeTutorialPaymentSession = async(session, paymentStatus) => {
    const paymentState = getPaynowState(paymentStatus);

    session.paymentMeta = {
        ...session.paymentMeta,
        paynowStatus: paymentStatus?.status || null,
        pollUrl: session.pollUrl,
        paynowReference: paymentStatus?.reference || session.reference,
        paynowAmount: paymentStatus?.amount || session.amount,
        lastPolledAt: new Date(),
    };

    if (paymentState === 'paid') {
        session.status = 'paid';
        const enrollment = await createPaidEnrollmentFromSession(session);
        await session.save();
        return {
            paymentState,
            enrollment,
        };
    }

    if (paymentState === 'cancelled' || paymentState === 'failed') {
        session.status = paymentState;
    }

    await session.save();
    return {
        paymentState,
        enrollment: null,
    };
};

// @desc    Enroll current user in a tutorial
// @route   POST /api/v1/enroll/:tutorialId
// @access  Private
exports.enrollTutorial = asyncHandler(async(req, res, next) => {
    return next(new ErrorResponse('Direct enrollment is disabled. Submit an enrollment request for artisan approval.', 400));
});

// @desc    Start tutorial payment with Paynow
// @route   POST /api/v1/enroll/:tutorialId/paynow
// @access  Private
exports.startTutorialPayment = asyncHandler(async(req, res, next) => {
    return next(new ErrorResponse('Tutorial payment enrollment is disabled. Submit an enrollment request for artisan approval.', 400));
});

// @desc    Confirm tutorial payment after Paynow redirect
// @route   GET /api/v1/enroll/paynow/confirm/:reference
// @access  Private
exports.confirmTutorialPayment = asyncHandler(async(req, res, next) => {
    const paynow = createPaynowClient();
    const session = await TutorialPaymentSession.findOne({ reference: req.params.reference });

    if (!session) {
        return next(new ErrorResponse('Tutorial payment session not found', 404));
    }

    if (String(session.userId) !== String(req.user.id) && req.user.role !== 'admin') {
        return next(new ErrorResponse('Not authorized', 403));
    }

    const paynowStatus = await paynow.pollTransaction(session.pollUrl);
    const result = await finalizeTutorialPaymentSession(session, paynowStatus);

    res.json({
        success: true,
        data: {
            reference: session.reference,
            paymentStatus: result.paymentState,
            tutorialId: session.tutorialId,
            enrollmentId: result.enrollment ? result.enrollment._id : session.enrollmentId || null,
        },
    });
});

// @desc    Paynow callback for tutorial payments
// @route   POST /api/v1/enroll/paynow/result/:reference
// @access  Public
exports.handleTutorialPaymentResult = asyncHandler(async(req, res) => {
    const paynow = createPaynowClient();
    const session = await TutorialPaymentSession.findOne({ reference: req.params.reference });

    if (!session) {
        return res.status(404).json({ success: false, message: 'Tutorial payment session not found' });
    }

    const paynowStatus = await paynow.pollTransaction(session.pollUrl);
    const result = await finalizeTutorialPaymentSession(session, paynowStatus);

    res.status(200).json({
        success: true,
        data: {
            reference: session.reference,
            paymentStatus: result.paymentState,
            tutorialId: session.tutorialId,
            enrollmentId: result.enrollment ? result.enrollment._id : session.enrollmentId || null,
        },
    });
});

// @desc    Get enrollment details for current user and tutorial
// @route   GET /api/v1/enroll/:tutorialId
// @access  Private
exports.getEnrollment = asyncHandler(async(req, res, next) => {
    const enrollment = await Enrollment.findOne({
        userId: req.user.id,
        tutorialId: req.params.tutorialId,
        status: 'APPROVED',
    });

    if (!enrollment) {
        return res.status(200).json({
            success: true,
            data: null
        });
    }

    normalizeCompletedLessons(enrollment);

    res.json({
        success: true,
        data: enrollment
    });
});

// @desc    Submit lesson exam answers
// @route   POST /api/v1/enroll/:tutorialId/lessons/:lessonId/exam
// @access  Private
exports.submitLessonExam = asyncHandler(async(req, res, next) => {
    const { answers } = req.body; // answers: [{ questionId, userAnswer }]

    const tutorial = await Tutorial.findById(req.params.tutorialId);
    if (!tutorial) {
        return next(new ErrorResponse('Tutorial not found', 404));
    }

    const lesson = tutorial.lessons.id(req.params.lessonId);
    if (!lesson) {
        return next(new ErrorResponse('Lesson not found', 404));
    }

    if (!lesson.exam || !lesson.exam.questions || lesson.exam.questions.length === 0) {
        return next(new ErrorResponse('No exam found for this lesson', 400));
    }

    const enrollment = await Enrollment.findOne({
        userId: req.user.id,
        tutorialId: req.params.tutorialId,
        status: 'APPROVED',
    });

    if (!enrollment) {
        return next(new ErrorResponse('Please enroll before taking exams', 400));
    }

    normalizeCompletedLessons(enrollment);

    // Check if previous lessons are completed
    const lessonIndex = tutorial.lessons.findIndex(l => l._id.toString() === req.params.lessonId);
    for (let i = 0; i < lessonIndex; i++) {
        const prevLesson = tutorial.lessons[i];
        const prevProgress = enrollment.completedLessons.find(cl => cl.lessonId === prevLesson._id.toString());
        if (!prevProgress || !prevProgress.examPassed) {
            return next(new ErrorResponse('Complete previous lessons first', 400));
        }
    }

    // Score the exam
    let correctAnswers = 0;
    const scoredAnswers = answers.map(answer => {
        const question = lesson.exam.questions.id(answer.questionId);
        if (!question) return {...answer, correct: false };

        const isCorrect = question.correctAnswer.toLowerCase().trim() === answer.userAnswer.toLowerCase().trim();
        if (isCorrect) correctAnswers++;
        return {...answer, correct: isCorrect };
    });

    const score = lesson.exam.questions.length > 0 ? (correctAnswers / lesson.exam.questions.length) * 100 : 0;
    const passed = score === 100; // Must get all correct for lesson exams

    // Update enrollment
    const lessonId = lesson._id.toString();
    let lessonProgress = enrollment.completedLessons.find(cl => cl.lessonId === lessonId);
    if (!lessonProgress) {
        lessonProgress = { lessonId, examPassed: passed };
        enrollment.completedLessons.push(lessonProgress);
    } else {
        lessonProgress.examPassed = passed;
    }

    // Recalculate progress: each lesson exam passed counts
    const totalLessons = tutorial.lessons.length;
    const passedLessons = tutorial.lessons.filter((tutorialLesson) =>
        hasPassedLessonExam(enrollment, tutorialLesson._id.toString())
    ).length;
    enrollment.progress = totalLessons > 0 ? Math.round((passedLessons / totalLessons) * 100) : 0;
    enrollment.completed = enrollment.progress === 100 && enrollment.finalExamPassed;

    await enrollment.save();

    res.json({
        success: true,
        data: {
            score,
            passed,
            answers: scoredAnswers
        },
        message: passed ? 'Lesson exam passed! You can proceed to the next lesson.' : 'Lesson exam failed. Please review the lesson and try again.'
    });
});
