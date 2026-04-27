import React, { useEffect, useState } from 'react';
import { useLocation, useNavigate, useParams, useSearchParams } from 'react-router-dom';
import apiService from '../services/api';

const Result = () => {
  const { id } = useParams();
  const location = useLocation();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const lessonId = searchParams.get('lessonId');
  const [submission, setSubmission] = useState(location.state?.submission || null);
  const [loading, setLoading] = useState(!submission);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (submission) return;

    const loadResult = async () => {
      try {
        const response = await apiService.getExamResult(id, lessonId);
        setSubmission(response.data);
      } catch (err) {
        console.error('Failed to load result:', err);
        setError(err.message || 'Unable to load exam result');
      } finally {
        setLoading(false);
      }
    };

    loadResult();
  }, [id, lessonId, submission]);

  const handleRetake = () => {
    const target = lessonId
      ? `/tutorials/${id}/exam?lessonId=${encodeURIComponent(lessonId)}`
      : `/tutorials/${id}/exam`;
    navigate(target);
  };

  const handleReturn = () => {
    navigate(`/tutorials/${id}`);
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

  if (!submission) {
    return (
      <div className="container mx-auto px-4 py-16 text-center">
        <p className="text-gray-700">No exam submission is available.</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-10">
      <div className="container mx-auto px-4 max-w-3xl">
        <div className="bg-white rounded-3xl shadow-lg p-10">
          <div className="text-center mb-8">
            <h1 className="text-4xl font-bold text-primary-brown">Exam Result</h1>
            <p className="text-gray-600 mt-2">Your performance summary is below.</p>
          </div>

          <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 mb-8">
            <div className="rounded-3xl border border-gray-200 p-6 bg-gray-50">
              <p className="text-sm text-gray-500">Score</p>
              <p className="mt-3 text-4xl font-semibold text-primary-brown">{submission.score}%</p>
            </div>
            <div className="rounded-3xl border border-gray-200 p-6 bg-gray-50">
              <p className="text-sm text-gray-500">Status</p>
              <p className={`mt-3 text-2xl font-semibold ${submission.passed ? 'text-green-600' : 'text-red-600'}`}>
                {submission.passed ? 'Passed' : 'Not passed'}
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 mb-8">
            <div className="rounded-3xl border border-gray-200 p-6 bg-gray-50">
              <p className="text-sm text-gray-500">Correct Answers</p>
              <p className="mt-3 text-3xl font-semibold text-primary-brown">
                {submission.correctCount ?? 0} / {submission.totalQuestions ?? submission.answers?.length ?? 0}
              </p>
            </div>
            <div className="rounded-3xl border border-gray-200 p-6 bg-gray-50">
              <p className="text-sm text-gray-500">Questions Answered</p>
              <p className="mt-3 text-3xl font-semibold text-primary-brown">
                {submission.answers?.filter((item) => item.userAnswer && String(item.userAnswer).trim() !== '').length ?? 0}
              </p>
            </div>
          </div>

          <div className="rounded-3xl border border-gray-200 p-6 mb-8">
            <h2 className="text-xl font-semibold text-primary-brown mb-4">Answer Summary</h2>
            <div className="space-y-4">
              {submission.answers.map((item, index) => (
                <div key={item.questionId} className="rounded-3xl bg-white p-4 border border-gray-100">
                  <div className="flex items-start justify-between gap-4">
                    <div>
                      <p className="text-sm text-gray-600">Question {index + 1}</p>
                      <p className="mt-2 text-sm font-medium text-gray-900">{item.questionText || item.questionId}</p>
                    </div>
                    <span className={`rounded-full px-3 py-1 text-xs font-semibold ${item.isCorrect ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                      {item.isCorrect ? 'Correct' : 'Incorrect'}
                    </span>
                  </div>
                  <p className="text-sm text-gray-700 mt-3">
                    Your answer: <span className="font-medium">{item.userAnswer || 'No answer'}</span>
                  </p>
                  {!item.isCorrect && (
                    <p className="text-sm text-gray-600 mt-2">
                      Correct answer: <span className="font-medium">{item.correctAnswer || 'Not available'}</span>
                    </p>
                  )}
                </div>
              ))}
            </div>
          </div>

          {submission.certificateUrl && (
            <div className="rounded-3xl border border-green-200 bg-green-50 p-6 text-center">
              <p className="text-lg font-semibold text-green-800">Certificate earned!</p>
              <a
                href={submission.certificateUrl}
                target="_blank"
                rel="noreferrer"
                className="mt-4 inline-flex rounded-full bg-green-600 px-8 py-3 text-white hover:bg-green-700 transition"
              >
                Download Certificate
              </a>
            </div>
          )}

          {!submission.passed && (
            <div className="mt-8 rounded-3xl border border-orange-200 bg-orange-50 p-6 text-center">
              <p className="text-lg font-semibold text-orange-800">You can retake this test.</p>
              <p className="mt-2 text-sm text-orange-700">
                Review your answers, then try again when you are ready.
              </p>
              <button
                type="button"
                onClick={handleRetake}
                className="mt-4 inline-flex rounded-full bg-primary-orange px-8 py-3 text-white transition hover:bg-primary-brown"
              >
                Retake Test
              </button>
            </div>
          )}

          <div className="mt-8 text-center">
            <button
              type="button"
              onClick={handleReturn}
              className="inline-flex rounded-full border border-slate-200 px-8 py-3 text-slate-700 transition hover:bg-slate-50"
            >
              Back to Tutorial
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Result;
