import React, { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import apiService from '../services/api';

const CoursePlayer = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [tutorial, setTutorial] = useState(null);
  const [enrollment, setEnrollment] = useState(null);
  const [selectedLessonId, setSelectedLessonId] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [actionLoading, setActionLoading] = useState(false);
  const [requestMessage, setRequestMessage] = useState('');
  const [requestState, setRequestState] = useState(null);

  useEffect(() => {
    const loadData = async () => {
      setLoading(true);
      try {
        const tutorialRes = await apiService.getTutorialById(id);
        setTutorial(tutorialRes.data);
        if (user) {
          const requestStatusRes = await apiService.getTutorialRequestStatus(id);
          const statusPayload = requestStatusRes?.data || requestStatusRes;
          setEnrollment(statusPayload?.enrollment || null);
          setRequestState(statusPayload?.request || null);
        }
      } catch (err) {
        console.error('Failed to load tutorial:', err);
        setError(err.message || 'Unable to load course');
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, [id, user]);

  useEffect(() => {
    if (tutorial && tutorial.lessons && tutorial.lessons.length > 0) {
      setSelectedLessonId((prev) => prev || tutorial.lessons[0]._id);
    }
  }, [tutorial]);

  const isLessonExamPassed = React.useCallback((lessonId) => {
    const completedLessons = enrollment?.completedLessons || [];
    const progressEntry = completedLessons.find((entry) => entry.lessonId === lessonId);
    return progressEntry && progressEntry.examPassed;
  }, [enrollment]);

  useEffect(() => {
    if (!tutorial || !enrollment || !selectedLessonId) return;

    const selectedIndex = tutorial.lessons.findIndex((lesson) => lesson._id === selectedLessonId);
    if (selectedIndex === -1) return;

    const isCurrentPassed = isLessonExamPassed(selectedLessonId);
    if (isCurrentPassed && selectedIndex < tutorial.lessons.length - 1) {
      const nextLesson = tutorial.lessons[selectedIndex + 1];
      setSelectedLessonId(nextLesson._id);
    }
  }, [enrollment, tutorial, selectedLessonId, isLessonExamPassed]);

  const handleEnroll = async () => {
    if (!user) {
      navigate('/login');
      return;
    }

    setActionLoading(true);
    try {
      const response = await apiService.requestTutorialEnrollment(id, {
        message: requestMessage,
      });
      const payload = response?.data || response;

      if (payload?.alreadyEnrolled && payload?.enrollment) {
        setEnrollment(payload.enrollment);
        setRequestState(null);
        return;
      }

      setRequestState(payload);
      setRequestMessage('');
    } catch (err) {
      console.error('Enroll error:', err);
      setError(err.message || 'Enrollment failed');
    } finally {
      setActionLoading(false);
    }
  };

  const handleSubmitLessonExam = async (lessonId) => {
    navigate(`/tutorials/${id}/exam?lessonId=${lessonId}`);
  };

  const selectedLesson = tutorial?.lessons?.find((lesson) => lesson._id === selectedLessonId);
  const progress = enrollment?.progress || 0;
  const pendingRequest = requestState?.status === 'PENDING';
  const rejectedRequest = requestState?.status === 'REJECTED';
  const approvedRequest = requestState?.status === 'APPROVED';
  const artisanPhone = tutorial?.artisanId?.Cell || '';
  const artisanEmail = tutorial?.artisanId?.email || '';

  const formatWhatsAppUrl = (phone, message) => {
    if (!phone) return null;
    const sanitized = String(phone).replace(/[^\d]/g, '');
    if (!sanitized) return null;
    return `https://wa.me/${sanitized}?text=${encodeURIComponent(message)}`;
  };

  const artisanWhatsAppUrl = formatWhatsAppUrl(
    artisanPhone,
    `Hello ${tutorial?.artisanId?.name || 'Artisan'}, I would like to ask about your tutorial "${tutorial?.title || 'this tutorial'}".`
  );


  const allLessonExamsPassed = Boolean(
    tutorial?.lessons?.length && tutorial.lessons.every((lesson) => isLessonExamPassed(lesson._id))
  );

  const canAccessLesson = (lessonIndex) => {
    if (!enrollment) return false;
    if (lessonIndex === 0) return true;
    const prevLesson = tutorial.lessons[lessonIndex - 1];
    return isLessonExamPassed(prevLesson._id);
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <div className="animate-spin h-14 w-14 border-b-2 border-orange-500 rounded-full" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="container mx-auto px-4 py-16">
        <div className="bg-red-100 text-red-700 p-6 rounded-lg">{error}</div>
      </div>
    );
  }

  if (!tutorial) {
    return (
      <div className="container mx-auto px-4 py-16 text-center">
        <p className="text-gray-700">Course not found.</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-10">
      <div className="container mx-auto px-4 grid gap-8 lg:grid-cols-[1.4fr_0.6fr]">
        <section className="bg-white rounded-3xl shadow-lg p-8">
          <div className="mb-6">
            <p className="text-sm uppercase tracking-[0.2em] text-primary-orange">Tutorial</p>
            <h1 className="text-4xl font-bold text-primary-brown mt-2">{tutorial.title}</h1>
            <p className="mt-4 text-gray-600">{tutorial.description}</p>
            <div className="mt-4 flex flex-wrap gap-3 text-sm text-gray-700">
              <span>{tutorial.lessons?.length || 0} lessons</span>
              <span>${tutorial.price?.toFixed(2) || '0.00'}</span>
              <span>Instructor: {tutorial.artisanId?.name || 'Artisan'}</span>
            </div>
          </div>

          <div className="mb-6">
            <div className="mb-2 text-sm text-gray-500">Progress</div>
            <div className="w-full h-3 rounded-full bg-gray-200 overflow-hidden">
              <div className="h-full bg-primary-orange" style={{ width: `${progress}%` }} />
            </div>
            <div className="mt-2 text-sm text-gray-600">{progress}% complete</div>
          </div>

          {!enrollment ? (
            <div className="rounded-3xl border border-dashed border-orange-200 p-6 text-center">
              <p className="text-lg font-semibold text-gray-700 mb-3">Ready to learn?</p>
              <p className="mb-4 text-sm text-gray-600">
                Send an enrollment request to the artisan. They will review it from their dashboard and approve or reject it manually.
              </p>
              <div className="mx-auto mb-5 max-w-2xl rounded-3xl border border-slate-200 bg-slate-50 p-5 text-left">
                <p className="text-sm font-semibold uppercase tracking-[0.2em] text-slate-500">Contact the artisan</p>
                <p className="mt-2 text-sm text-slate-600">
                  If you want to ask questions before requesting approval, you can contact {tutorial.artisanId?.name || 'the artisan'} directly.
                </p>
                <div className="mt-4 flex flex-wrap gap-3">
                  {artisanWhatsAppUrl && (
                    <a
                      href={artisanWhatsAppUrl}
                      target="_blank"
                      rel="noreferrer"
                      className="inline-flex items-center justify-center rounded-full bg-emerald-500 px-4 py-2 text-sm font-semibold text-white transition hover:bg-emerald-600"
                    >
                      WhatsApp
                    </a>
                  )}
                  {artisanEmail && (
                    <a
                      href={`mailto:${artisanEmail}?subject=${encodeURIComponent(`Tutorial enquiry: ${tutorial.title}`)}`}
                      className="inline-flex items-center justify-center rounded-full bg-slate-900 px-4 py-2 text-sm font-semibold text-white transition hover:bg-slate-700"
                    >
                      Email
                    </a>
                  )}
                  {artisanPhone && (
                    <a
                      href={`tel:${artisanPhone}`}
                      className="inline-flex items-center justify-center rounded-full bg-blue-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-blue-700"
                    >
                      Call
                    </a>
                  )}
                </div>
                {artisanPhone && <p className="mt-3 text-sm text-slate-600">Phone: {artisanPhone}</p>}
                {artisanEmail && <p className="mt-1 text-sm text-slate-600">Email: {artisanEmail}</p>}
              </div>
              <textarea
                value={requestMessage}
                onChange={(e) => setRequestMessage(e.target.value)}
                rows={4}
                placeholder="Optional message to the artisan"
                className="mx-auto mb-4 w-full max-w-2xl rounded-3xl border border-gray-300 px-4 py-3 text-sm text-gray-700 focus:outline-none focus:ring-2 focus:ring-primary-orange"
              />
              <button
                onClick={handleEnroll}
                disabled={actionLoading || pendingRequest}
                className="bg-primary-orange text-white px-6 py-3 rounded-full transition hover:bg-primary-brown"
              >
                {actionLoading ? 'Sending request...' : pendingRequest ? 'Request Pending' : 'Request Enrollment'}
              </button>

              {pendingRequest && (
                <div className="mt-4 rounded-2xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-800">
                  Your enrollment request is pending artisan approval.
                </div>
              )}

              {rejectedRequest && (
                <div className="mt-4 rounded-2xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">
                  Your last request was rejected. You can send another request with more details.
                </div>
              )}

              {approvedRequest && !enrollment && (
                <div className="mt-4 rounded-2xl border border-green-200 bg-green-50 p-4 text-sm text-green-700">
                  Your request was approved. Refresh the page if access has not appeared yet.
                </div>
              )}
            </div>
          ) : (
            <div className="rounded-3xl border border-green-200 bg-green-50 p-6 mb-8">
              <p className="font-medium text-green-700">You are enrolled in this tutorial.</p>
              <p className="text-sm text-gray-700">Complete all lessons to unlock the exam.</p>
            </div>
          )}

          {enrollment && selectedLesson ? (
            <div className="space-y-6">
              <div className="rounded-3xl border border-gray-200 p-6 bg-gray-50">
                <div className="flex items-center justify-between gap-4">
                  <div>
                    <p className="text-sm text-gray-500">Lesson</p>
                    <h2 className="text-2xl font-semibold text-primary-brown">{selectedLesson.title}</h2>
                    <p className="text-sm text-gray-600 mt-1">Type: {selectedLesson.type}</p>
                  </div>
                  <div className="text-sm text-gray-500">Duration: {selectedLesson.duration || 'N/A'} mins</div>
                </div>

                <div className="mt-6">
                  {selectedLesson.type === 'video' ? (
                    <video
                      controls
                      src={selectedLesson.contentUrl}
                      className="w-full rounded-3xl bg-black"
                    />
                  ) : (
                    <div className="prose max-w-none text-gray-700 whitespace-pre-line">
                      {selectedLesson.contentUrl}
                    </div>
                  )}
                </div>

                {!isLessonExamPassed(selectedLesson._id) && (
                  <button
                    onClick={() => handleSubmitLessonExam(selectedLesson._id)}
                    disabled={actionLoading}
                    className="mt-6 inline-flex items-center justify-center rounded-full bg-primary-orange px-5 py-3 text-white transition hover:bg-primary-brown"
                  >
                    {actionLoading ? 'Loading...' : 'Take Lesson Exam'}
                  </button>
                )}

                {isLessonExamPassed(selectedLesson._id) && (
                  <div className="mt-6 inline-flex items-center gap-2 rounded-full bg-green-100 px-5 py-3 text-green-700">
                    OK Lesson exam passed
                  </div>
                )}
              </div>

              {allLessonExamsPassed && tutorial.exam?.questions?.length > 0 && (
                <div className="rounded-3xl border border-blue-200 bg-blue-50 p-6 text-center">
                  <p className="text-lg font-semibold text-blue-800">Final Exam is unlocked</p>
                  <p className="text-sm text-gray-700 mt-2">Complete the final exam to receive your certificate.</p>
                  <button
                    onClick={() => navigate(`/tutorials/${id}/exam`)}
                    className="mt-4 rounded-full bg-blue-600 px-6 py-3 text-white hover:bg-blue-700 transition"
                  >
                    Take Final Exam
                  </button>
                </div>
              )}

              {!allLessonExamsPassed && (
                <div className="rounded-3xl border border-yellow-200 bg-yellow-50 p-6 text-sm text-yellow-800">
                  Complete all lesson exams to unlock the final exam. Keep going!
                </div>
              )}
            </div>
          ) : (
            <div className="rounded-3xl border border-gray-200 p-6 bg-gray-50 text-center">
              <p className="text-gray-700">
                {enrollment
                  ? 'Select a lesson from the sidebar to begin.'
                  : 'Send an enrollment request to unlock tutorial access after artisan approval.'}
              </p>
            </div>
          )}
        </section>

        <aside className="space-y-6">
          <div className="bg-white rounded-3xl shadow-lg p-6">
            <h3 className="text-lg font-semibold text-primary-brown mb-4">Lessons</h3>
            <div className="space-y-3">
              {tutorial.lessons?.map((lesson, index) => {
                const isPassed = isLessonExamPassed(lesson._id);
                const isAccessible = canAccessLesson(index);

                return (
                  <button
                    key={lesson._id}
                    onClick={() => isAccessible && setSelectedLessonId(lesson._id)}
                    disabled={!isAccessible}
                    className={`w-full text-left rounded-3xl border px-4 py-4 transition ${
                      selectedLessonId === lesson._id
                        ? 'border-primary-orange bg-primary-orange/10'
                        : isAccessible
                        ? 'border-gray-200 bg-white hover:border-gray-300'
                        : 'border-gray-200 bg-gray-100 cursor-not-allowed opacity-60'
                    }`}
                  >
                    <div className="flex justify-between items-center gap-2">
                      <div>
                        <p className={`font-semibold text-sm ${isAccessible ? 'text-primary-brown' : 'text-gray-500'}`}>
                          {lesson.title}
                        </p>
                        <p className="text-xs text-gray-500">{lesson.type.toUpperCase()}</p>
                      </div>
                      {isPassed && <span className="text-sm text-green-700">Passed</span>}
                      {!isPassed && isAccessible && <span className="text-sm text-orange-600">Exam Required</span>}
                      {!isAccessible && <span className="text-sm text-gray-400">{enrollment ? 'Locked' : 'Approval required'}</span>}
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          <div className="bg-white rounded-3xl shadow-lg p-6">
            <h3 className="text-lg font-semibold text-primary-brown mb-4">Course details</h3>
            <div className="space-y-3 text-sm text-gray-600">
              <div className="flex justify-between"><span>Price</span><span>${tutorial.price?.toFixed(2) || '0.00'}</span></div>
              <div className="flex justify-between"><span>Total lessons</span><span>{tutorial.lessons?.length || 0}</span></div>
              <div className="flex justify-between"><span>Enrolled</span><span>{enrollment ? 'Yes' : 'No'}</span></div>
              <div className="flex justify-between"><span>Request status</span><span>{requestState?.status || (enrollment ? 'APPROVED' : 'NOT SENT')}</span></div>
            </div>
          </div>
        </aside>
      </div>
    </div>
  );
};

export default CoursePlayer;
