import React, { useEffect, useState } from 'react';
import { useNavigate, useParams, useSearchParams } from 'react-router-dom';
import apiService from '../services/api';

const Exam = () => {
  const { id } = useParams();
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const lessonId = searchParams.get('lessonId');
  const [exam, setExam] = useState(null);
  const [answers, setAnswers] = useState({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    const loadExam = async () => {
      try {
        const response = await apiService.getExam(id, lessonId);
        setExam(response.data);
      } catch (err) {
        console.error('Exam load failed:', err);
        setError(err.message || 'Unable to load exam');
      } finally {
        setLoading(false);
      }
    };

    loadExam();
  }, [id, lessonId]);

  const handleChange = (questionId, value) => {
    setAnswers((prev) => ({ ...prev, [questionId]: value }));
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    setSubmitting(true);
    setError(null);

    try {
      const answersArray = Object.entries(answers).map(([questionId, userAnswer]) => ({
        questionId,
        userAnswer: userAnswer || ''
      }));

      const response = await apiService.submitExam(id, answersArray, lessonId);
      const submission = response.data;

      if (lessonId) {
        navigate(
          `/tutorials/${id}/result?lessonId=${encodeURIComponent(lessonId)}`,
          { state: { submission } }
        );
      } else {
        navigate(`/tutorials/${id}/result`, { state: { submission } });
      }
    } catch (err) {
      console.error('Submit exam failed:', err);
      setError(err.message || 'Failed to submit exam');
    } finally {
      setSubmitting(false);
    }
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

  if (!exam) {
    return (
      <div className="container mx-auto px-4 py-16">
        <div className="bg-white p-8 rounded-3xl shadow text-center">No exam found for this tutorial.</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-10">
      <div className="container mx-auto px-4 max-w-4xl">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-primary-brown">{exam.title}</h1>
          <p className="text-gray-600 mt-2">
            {lessonId ? 'Complete the lesson exam to proceed to the next lesson.' : 'Complete the final exam to receive your certificate.'}
          </p>
        </div>

        {!exam.allowed ? (
          <div className="bg-yellow-50 border border-yellow-200 text-yellow-800 rounded-3xl p-8">
            <h2 className="text-xl font-semibold">Exam locked</h2>
            <p className="mt-3">
              {lessonId ? 'Complete previous lessons first.' : 'Finish all lesson exams before you can take the final exam.'}
            </p>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-8 bg-white rounded-3xl shadow-lg p-8">
            {exam.questions.map((question, index) => (
              <div key={question._id} className="space-y-4">
                <div>
                  <div className="text-sm text-gray-500">Question {index + 1}</div>
                  <h2 className="text-lg font-semibold text-primary-brown">{question.questionText}</h2>
                </div>

                {question.type === 'mcq' ? (
                  <div className="grid gap-3">
                    {question.options?.map((option) => (
                      <label key={option} className="flex items-center gap-3 rounded-3xl border border-gray-200 p-4 hover:border-primary-orange transition">
                        <input
                          type="radio"
                          name={question._id}
                          value={option}
                          checked={answers[question._id] === option}
                          onChange={() => handleChange(question._id, option)}
                          className="form-radio text-primary-orange"
                        />
                        <span>{option}</span>
                      </label>
                    ))}
                  </div>
                ) : (
                  <textarea
                    value={answers[question._id] || ''}
                    onChange={(e) => handleChange(question._id, e.target.value)}
                    placeholder="Write your answer here"
                    rows="4"
                    className="w-full rounded-3xl border border-gray-300 px-4 py-4 focus:outline-none focus:ring-2 focus:ring-primary-orange"
                  />
                )}
              </div>
            ))}

            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <div className="text-sm text-gray-600">{exam.questions.length} questions total</div>
              <button
                type="submit"
                disabled={submitting}
                className="rounded-full bg-primary-orange px-8 py-3 text-white transition hover:bg-primary-brown disabled:bg-gray-400"
              >
                {submitting ? 'Submitting...' : lessonId ? 'Submit Lesson Exam' : 'Submit Final Exam'}
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
};

export default Exam;
