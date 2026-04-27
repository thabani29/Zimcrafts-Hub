const Tutorial = require('../models/Tutorial');
const Submission = require('../models/Submission');
const Enrollment = require('../models/Enrollment');
const asyncHandler = require('../utils/asyncHandler');
const ErrorResponse = require('../utils/errorResponse');

// Helper functions
const normalize = (val) =>
    val
        ? val
              .toString()
              .trim()
              .toLowerCase()
              .replace(/[^\w\s]/g, ' ')
              .replace(/\s+/g, ' ')
        : '';

const getAcceptedAnswers = (correctAnswer) => {
    const raw = String(correctAnswer || '');

    return raw
        .split(/\r?\n|;|\|{1,2}/)
        .map((answer) => normalize(answer))
        .filter(Boolean);
};

const isAnswerCorrect = (question, userAnswer) => {
    const normalizedUserAnswer = normalize(userAnswer);
    const acceptedAnswers = getAcceptedAnswers(question.correctAnswer);

    if (!normalizedUserAnswer || acceptedAnswers.length === 0) {
        return false;
    }

    return acceptedAnswers.includes(normalizedUserAnswer);
};

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
        enrollment &&
            normalizeCompletedLessons(enrollment).find(
                (cl) => cl.lessonId === lessonId && cl.examPassed
            )
    );

const hasCompletedAllLessonExams = (tutorial, enrollment) => {
    if (!tutorial || !tutorial.lessons || tutorial.lessons.length === 0) {
        return false;
    }

    return tutorial.lessons.every((lesson) =>
        hasPassedLessonExam(enrollment, lesson._id.toString())
    );
};

// @desc    Get exam details
// @route   GET /api/v1/exam/:tutorialId
// @access  Private
exports.getExam = asyncHandler(async(req, res, next) => {
    const { lessonId } = req.query; // for lesson exams

    const tutorial = await Tutorial.findById(req.params.tutorialId);

    if (!tutorial) {
        return next(new ErrorResponse('Tutorial not found', 404));
    }

    const enrollment = await Enrollment.findOne({
        userId: req.user.id,
        tutorialId: req.params.tutorialId,
        status: 'APPROVED',
    });

    if (!enrollment) {
        return next(
            new ErrorResponse('Please enroll before taking exams', 400)
        );
    }

    normalizeCompletedLessons(enrollment);

    let allowed = false;
    let questions = [];

    if (lessonId) {
        // Lesson exam
        const lesson = tutorial.lessons.id(lessonId);
        if (!lesson) {
            return next(new ErrorResponse('Lesson not found', 404));
        }

        // Check if previous lessons are completed
        const lessonIndex = tutorial.lessons.findIndex(l => l._id.toString() === lessonId);
        allowed = true;
        for (let i = 0; i < lessonIndex; i++) {
            const prevLesson = tutorial.lessons[i];
            if (!hasPassedLessonExam(enrollment, prevLesson._id.toString())) {
                allowed = false;
                break;
            }
        }

        questions = lesson.exam && lesson.exam.questions ?
            lesson.exam.questions.map((q) => ({
                _id: q._id,
                questionText: q.questionText,
                type: q.type,
                options: q.options || [],
            })) : [];
    } else {
        // Final exam
        allowed = hasCompletedAllLessonExams(tutorial, enrollment);

        questions = tutorial.exam && tutorial.exam.questions ?
            tutorial.exam.questions.map((q) => ({
                _id: q._id,
                questionText: q.questionText,
                type: q.type,
                options: q.options || [],
            })) : [];
    }

    res.json({
        success: true,
        data: {
            tutorialId: tutorial._id,
            lessonId: lessonId || null,
            examType: lessonId ? 'lesson' : 'final',
            title: tutorial.title,
            allowed,
            totalLessons: tutorial.lessons.length,
            progress: enrollment ? enrollment.progress : 0,
            questions,
        },
    });
});

// @desc    Submit exam
// @route   POST /api/v1/exam/:tutorialId
// @access  Private
exports.submitExam = asyncHandler(async(req, res, next) => {
    const { answers, lessonId } = req.body; // lessonId for lesson exams

    const tutorial = await Tutorial.findById(req.params.tutorialId);

    if (!tutorial) {
        return next(new ErrorResponse('Tutorial not found', 404));
    }

    const enrollment = await Enrollment.findOne({
        userId: req.user.id,
        tutorialId: req.params.tutorialId,
        status: 'APPROVED',
    });

    if (!enrollment) {
        return next(
            new ErrorResponse('Please enroll before taking exams', 400)
        );
    }

    normalizeCompletedLessons(enrollment);

    let questions = [];
    let examType = 'final';
    let passThreshold = 95; // for final exam

    if (lessonId) {
        // Lesson exam
        const lesson = tutorial.lessons.id(lessonId);
        if (!lesson) {
            return next(new ErrorResponse('Lesson not found', 404));
        }

        // Check if previous lessons are completed
        const lessonIndex = tutorial.lessons.findIndex(l => l._id.toString() === lessonId);
        for (let i = 0; i < lessonIndex; i++) {
            const prevLesson = tutorial.lessons[i];
            if (!hasPassedLessonExam(enrollment, prevLesson._id.toString())) {
                return next(new ErrorResponse('Complete previous lessons first', 403));
            }
        }

        questions = lesson.exam && lesson.exam.questions ? lesson.exam.questions : [];
        examType = 'lesson';
        passThreshold = 100; // must get all correct for lesson exams
    } else {
        // Final exam
        if (!hasCompletedAllLessonExams(tutorial, enrollment)) {
            return next(
                new ErrorResponse(
                    'You must complete all lesson exams before taking the final exam',
                    403
                )
            );
        }
        questions = tutorial.exam && tutorial.exam.questions ? tutorial.exam.questions : [];
        examType = 'final';
        passThreshold = 95;
    }

    if (!Array.isArray(answers) || answers.length === 0) {
        return next(
            new ErrorResponse('Answers are required to submit exam', 400)
        );
    }

    let correctCount = 0;

    const evaluatedAnswers = questions.map((question) => {
        const answerItem = answers.find(
            (a) => a.questionId === question._id.toString()
        );

        const userAnswer = answerItem && answerItem.userAnswer ? answerItem.userAnswer : '';
        const isCorrect = isAnswerCorrect(question, userAnswer);

        if (isCorrect) {
            correctCount++;
        }

        return {
            questionId: question._id.toString(),
            questionText: question.questionText,
            userAnswer,
            correctAnswer: question.correctAnswer,
            isCorrect,
            questionType: question.type,
        };
    });

    const totalQuestions = questions.length;
    const score =
        totalQuestions > 0
            ? Math.round((correctCount / totalQuestions) * 100)
            : 0;

    const passed = score >= passThreshold;

    const certificateUrl = (examType === 'final' && passed) ?
        `${process.env.FRONTEND_URL || 'http://localhost:3000'}/certificate/${tutorial._id}/${req.user.id}` :
        null;

    const submission = await Submission.create({
        userId: req.user.id,
        tutorialId: req.params.tutorialId,
        lessonId: lessonId || null,
        examType,
        score,
        totalQuestions,
        correctCount,
        passed,
        certificateUrl,
        answers: evaluatedAnswers,
        submittedAt: Date.now(),
    });

    if (examType === 'lesson' && enrollment) {
        const existingLessonProgress = enrollment.completedLessons.find(
            (cl) => cl.lessonId === lessonId
        );

        if (existingLessonProgress) {
            existingLessonProgress.examPassed = passed;
        } else {
            enrollment.completedLessons.push({
                lessonId,
                examPassed: passed,
            });
        }

        const totalLessons = tutorial.lessons.length;
        const passedLessons = tutorial.lessons.filter((lesson) =>
            hasPassedLessonExam(enrollment, lesson._id.toString())
        ).length;

        enrollment.progress =
            totalLessons > 0
                ? Math.round((passedLessons / totalLessons) * 100)
                : 0;
        enrollment.completed = enrollment.progress === 100 && enrollment.finalExamPassed;
        await enrollment.save();
    }

    // For final exam, update enrollment
    if (examType === 'final' && passed) {
        enrollment.finalExamPassed = true;
        enrollment.completed = true;
        await enrollment.save();
    }

    res.status(201).json({
        success: true,
        data: submission,
    });
});

// @desc    Get latest exam result
// @route   GET /api/v1/exam/:tutorialId/result
// @access  Private
exports.getExamResult = asyncHandler(async(req, res, next) => {
    const { lessonId } = req.query; // for lesson exams

    const query = {
        userId: req.user.id,
        tutorialId: req.params.tutorialId,
    };

    if (lessonId) {
        query.lessonId = lessonId;
        query.examType = 'lesson';
    } else {
        query.examType = 'final';
    }

    const submission = await Submission.findOne(query).sort('-submittedAt');

    if (!submission) {
        return next(
            new ErrorResponse(
                'No exam submission found for this tutorial',
                404
            )
        );
    }

    res.json({
        success: true,
        data: submission,
    });
});
