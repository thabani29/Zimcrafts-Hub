import React, { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import apiService from '../services/api';

const emptyQuestion = { questionText: '', type: 'mcq', options: ['', '', ''], correctAnswer: '' };
const emptyLesson = { title: '', type: 'text', contentUrl: '', duration: '', examQuestions: [{ ...emptyQuestion }] };
const MAX_VIDEO_SIZE = 100 * 1024 * 1024;

const UploadTutorial = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { user } = useAuth();
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [price, setPrice] = useState('');
  const [category, setCategory] = useState('');
  const [categories, setCategories] = useState([]);
  const [lessons, setLessons] = useState([ { ...emptyLesson } ]);
  const [finalExamQuestions, setFinalExamQuestions] = useState([ { ...emptyQuestion } ]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [, setUploadProgress] = useState({});
  const [uploadingLesson, setUploadingLesson] = useState(null);
  const [isEditing, setIsEditing] = useState(false);
  const [tutorialId, setTutorialId] = useState(null);

  const fetchTutorialForEditing = async (id) => {
    try {
      setLoading(true);
      console.log('Fetching tutorial with ID:', id);
      const response = await apiService.getTutorialById(id);
      const tutorial = response.data;

      setTitle(tutorial.title || '');
      setDescription(tutorial.description || '');
      setPrice(tutorial.price?.toString() || '');
      setCategory(tutorial.category?._id || tutorial.category || '');

      if (tutorial.lessons && tutorial.lessons.length > 0) {
        setLessons(tutorial.lessons.map(lesson => ({
          title: lesson.title || '',
          type: lesson.type || 'text',
          contentUrl: lesson.contentUrl || '',
          duration: lesson.duration?.toString() || '',
          examQuestions: (lesson.exam && lesson.exam.questions && lesson.exam.questions.length > 0)
            ? lesson.exam.questions.map(question => ({
                questionText: question.questionText || '',
                type: question.type || 'mcq',
                options: question.options || ['', '', ''],
                correctAnswer: question.correctAnswer || ''
              }))
            : [{ ...emptyQuestion }]
        })));
      }

      if (tutorial.exam && tutorial.exam.questions && tutorial.exam.questions.length > 0) {
        setFinalExamQuestions(tutorial.exam.questions.map(question => ({
          questionText: question.questionText || '',
          type: question.type || 'mcq',
          options: question.options || ['', '', ''],
          correctAnswer: question.correctAnswer || ''
        })));
      }
    } catch (err) {
      console.error('Error fetching tutorial:', err);
      setError('Failed to load tutorial for editing');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const id = searchParams.get('id');
    console.log('useEffect: URL search params - id:', id);
    if (id) {
      console.log('Setting editing mode with tutorial ID:', id);
      setIsEditing(true);
      setTutorialId(id);
      fetchTutorialForEditing(id);
    }
  }, [searchParams]);

  useEffect(() => {
    const fetchCategories = async () => {
      try {
        const data = await apiService.getCategories();
        setCategories(Array.isArray(data) ? data : (data?.data || []));
      } catch (err) {
        console.error("Error fetching categories:", err.message || err);
      }
    };
    fetchCategories();
  }, []);

  if (!user || (user.role !== 'artisan/seller' && user.role !== 'artisan' && user.role !== 'admin')) {
    return (
      <div className="min-h-screen py-16 bg-gray-50">
        <div className="container mx-auto px-4 max-w-2xl bg-white rounded-3xl shadow p-10 text-center">
          <h2 className="text-2xl font-semibold text-primary-brown">Access denied</h2>
          <p className="mt-4 text-gray-600">Only artisans can create new tutorials.</p>
        </div>
      </div>
    );
  }

  const handleLessonExamQuestionChange = (lessonIndex, questionIndex, field, value) => {
    setLessons((prev) => prev.map((lesson, lIdx) =>
      lIdx === lessonIndex
        ? {
            ...lesson,
            examQuestions: lesson.examQuestions.map((question, qIdx) =>
              qIdx === questionIndex ? { ...question, [field]: value } : question
            )
          }
        : lesson
    ));
  };

  const handleLessonExamQuestionOptionChange = (lessonIndex, questionIndex, optionIndex, value) => {
    setLessons((prev) => prev.map((lesson, lIdx) =>
      lIdx === lessonIndex
        ? {
            ...lesson,
            examQuestions: lesson.examQuestions.map((question, qIdx) =>
              qIdx === questionIndex
                ? {
                    ...question,
                    options: question.options.map((opt, oIdx) => oIdx === optionIndex ? value : opt)
                  }
                : question
            )
          }
        : lesson
    ));
  };

  const addLessonExamQuestion = (lessonIndex) => {
    setLessons((prev) => prev.map((lesson, lIdx) =>
      lIdx === lessonIndex
        ? { ...lesson, examQuestions: [...lesson.examQuestions, { ...emptyQuestion }] }
        : lesson
    ));
  };

  const removeLessonExamQuestion = (lessonIndex, questionIndex) => {
    setLessons((prev) => prev.map((lesson, lIdx) =>
      lIdx === lessonIndex
        ? {
            ...lesson,
            examQuestions: lesson.examQuestions.filter((_, qIdx) => qIdx !== questionIndex)
          }
        : lesson
    ));
  };

  const handleLessonChange = (index, field, value) => {
    setLessons((prev) => prev.map((lesson, idx) => idx === index ? { ...lesson, [field]: value } : lesson));
  };

  const addLesson = () => {
    setLessons([...lessons, { ...emptyLesson }]);
  };

  const removeLesson = (index) => {
    if (lessons.length === 1) {
      alert('You must have at least one lesson.');
      return;
    }
    setLessons(lessons.filter((_, idx) => idx !== index));
  };

  const handleFinalExamQuestionChange = (index, field, value) => {
    setFinalExamQuestions((prev) => prev.map((question, idx) => idx === index ? { ...question, [field]: value } : question));
  };

  const handleFinalExamQuestionOptionChange = (questionIndex, optionIndex, value) => {
    setFinalExamQuestions((prev) =>
      prev.map((question, qIdx) =>
        qIdx === questionIndex
          ? { ...question, options: question.options.map((opt, oIdx) => oIdx === optionIndex ? value : opt) }
          : question
      )
    );
  };

  const addFinalExamQuestion = () => {
    setFinalExamQuestions([...finalExamQuestions, { ...emptyQuestion }]);
  };

  const removeFinalExamQuestion = (index) => {
    setFinalExamQuestions(finalExamQuestions.filter((_, idx) => idx !== index));
  };

  const uploadLessonVideo = async (lessonIndex, file) => {
    if (file.size > MAX_VIDEO_SIZE) {
      setError(`Video file is too large. Maximum size is 100MB.`);
      return;
    }

    try {
      setUploadingLesson(lessonIndex);
      console.log(`Uploading video for lesson ${lessonIndex}...`);

      const responseData = await apiService.uploadTutorialVideo(file, (progress) => {
        setUploadProgress((prev) => ({ ...prev, [lessonIndex]: progress }));
      });

      console.log('Upload response:', responseData);

      const videoUrl = responseData.url;
      if (!videoUrl) {
        throw new Error('Unable to retrieve uploaded video URL.');
      }

      handleLessonChange(lessonIndex, 'contentUrl', videoUrl);
    } catch (err) {
      console.error('Video upload failed:', err);
      setError(err.message || 'Video upload failed');
    } finally {
      setUploadingLesson(null);
    }
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    setError(null);

    if (!title.trim() || !description.trim() || !price) {
      setError('Title, description, and price are required.');
      return;
    }

    const invalidLesson = lessons.some((lesson) => {
      if (!lesson.title.trim()) return true;
      if (lesson.type === 'video' && !lesson.contentUrl.trim()) return true;
      return false;
    });

    if (!lessons.length || invalidLesson) {
      setError('Each lesson requires a title, and video lessons must be uploaded.');
      return;
    }

    const formattedLessons = lessons.map((lesson) => ({
      title: lesson.title,
      type: lesson.type,
      contentUrl: lesson.contentUrl,
      duration: Number(lesson.duration) || 0,
      exam: {
        questions: lesson.examQuestions
          .filter((question) => question.questionText.trim())
          .map((question) => ({
            questionText: question.questionText,
            type: question.type,
            options: question.type === 'mcq' ? question.options.filter(Boolean) : [],
            correctAnswer: question.correctAnswer
          }))
      }
    }));

    const formattedFinalExam = {
      questions: finalExamQuestions
        .filter((question) => question.questionText.trim())
        .map((question) => ({
          questionText: question.questionText,
          type: question.type,
          options: question.type === 'mcq' ? question.options.filter(Boolean) : [],
          correctAnswer: question.correctAnswer
        }))
    };

    setLoading(true);
    try {
      console.log('Form submission - isEditing:', isEditing, 'tutorialId:', tutorialId);
      if (isEditing && tutorialId) {
        console.log('Updating tutorial with ID:', tutorialId);
        await apiService.updateTutorial(tutorialId, {
          title,
          description,
          price: Number(price),
          category,
          lessons: formattedLessons,
          exam: formattedFinalExam
        });
        alert('Tutorial updated successfully');
      } else {
        console.log('Creating new tutorial');
        await apiService.createTutorial({
          title,
          description,
          price: Number(price),
          category,
          lessons: formattedLessons,
          exam: formattedFinalExam
        });
        alert('Tutorial created successfully');
      }
      navigate('/seller-dashboard');
    } catch (err) {
      console.error('Tutorial save failed:', err);
      setError(err.message || `Unable to ${isEditing ? 'update' : 'create'} tutorial`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 py-10">
      <div className="container mx-auto px-4 max-w-5xl">
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-primary-brown">{isEditing ? 'Edit Tutorial' : 'Create a New Tutorial'}</h1>
          <p className="text-gray-600 mt-2">{isEditing ? 'Update your course with lessons and exam questions.' : 'Build your course with lessons and exam questions for your customers.'}</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-8 bg-white rounded-3xl shadow-lg p-8">
          {error && <div className="rounded-3xl border border-red-200 bg-red-50 p-4 text-red-700">{error}</div>}

          <div className="grid gap-6 md:grid-cols-3">
            <div>
              <label className="block text-sm font-medium text-gray-700">Title</label>
              <input
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="Enter tutorial title"
                className="mt-2 w-full rounded-3xl border border-gray-300 px-4 py-3 focus:outline-none focus:ring-2 focus:ring-primary-orange"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">Price (USD)</label>
              <input
                type="number"
                min="0"
                step="0.01"
                value={price}
                onChange={(e) => setPrice(e.target.value)}
                placeholder="e.g. 29.99"
                className="mt-2 w-full rounded-3xl border border-gray-300 px-4 py-3 focus:outline-none focus:ring-2 focus:ring-primary-orange"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">Category</label>
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                className="mt-2 w-full rounded-3xl border border-gray-300 px-4 py-3 focus:outline-none focus:ring-2 focus:ring-primary-orange"
              >
                <option value="">Select a category</option>
                {categories.map((cat) => (
                  <option key={cat._id} value={cat._id}>
                    {cat.name}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700">Description</label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Describe your tutorial"
              rows="4"
              className="mt-2 w-full rounded-3xl border border-gray-300 px-4 py-3 focus:outline-none focus:ring-2 focus:ring-primary-orange"
            />
          </div>

          <div>
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-semibold">Lessons</h2>
              <button
                type="button"
                onClick={addLesson}
                className="bg-primary-orange text-white px-4 py-2 rounded-3xl hover:bg-primary-brown"
              >
                + Add Lesson
              </button>
            </div>

            <div className="space-y-4">
              {lessons.map((lesson, index) => (
                <div key={index} className="border border-gray-300 rounded-3xl p-4">
                  <div className="grid gap-4 md:grid-cols-3">
                    <div>
                      <label className="block text-sm font-medium text-gray-700">Lesson Title</label>
                      <input
                        type="text"
                        value={lesson.title}
                        onChange={(e) => handleLessonChange(index, 'title', e.target.value)}
                        placeholder="Lesson title"
                        className="mt-1 w-full rounded-3xl border border-gray-300 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-primary-orange"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700">Type</label>
                      <select
                        value={lesson.type}
                        onChange={(e) => handleLessonChange(index, 'type', e.target.value)}
                        className="mt-1 w-full rounded-3xl border border-gray-300 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-primary-orange"
                      >
                        <option value="text">Text</option>
                        <option value="video">Video</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700">Duration (minutes)</label>
                      <input
                        type="number"
                        value={lesson.duration}
                        onChange={(e) => handleLessonChange(index, 'duration', e.target.value)}
                        placeholder="0"
                        className="mt-1 w-full rounded-3xl border border-gray-300 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-primary-orange"
                      />
                    </div>
                  </div>

                  {lesson.type === 'video' ? (
                    <div className="mt-4">
                      <label className="block text-sm font-medium text-gray-700">Upload Video</label>
                      <input
                        type="file"
                        accept="video/*"
                        onChange={(e) => {
                          if (e.target.files && e.target.files[0]) {
                            uploadLessonVideo(index, e.target.files[0]);
                          }
                        }}
                        className="mt-1 w-full"
                      />
                      {uploadingLesson === index && <p className="mt-2 text-primary-orange">Uploading...</p>}
                      {lesson.contentUrl && <p className="mt-2 text-green-600">Video uploaded</p>}
                    </div>
                  ) : (
                    <div className="mt-4">
                      <label className="block text-sm font-medium text-gray-700">Content</label>
                      <textarea
                        value={lesson.contentUrl}
                        onChange={(e) => handleLessonChange(index, 'contentUrl', e.target.value)}
                        placeholder="Enter lesson content"
                        rows="3"
                        className="mt-1 w-full rounded-3xl border border-gray-300 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-primary-orange"
                      />
                    </div>
                  )}

                  {lessons.length > 1 && (
                    <button
                      type="button"
                      onClick={() => removeLesson(index)}
                      className="mt-4 bg-red-500 text-white px-4 py-2 rounded hover:bg-red-600"
                    >
                      Remove Lesson
                    </button>
                  )}

                  <div className="mt-6 border-t pt-4">
                    <div className="flex justify-between items-center mb-4">
                      <h3 className="text-lg font-semibold">Lesson Exam Questions</h3>
                      <button
                        type="button"
                        onClick={() => addLessonExamQuestion(index)}
                        className="bg-blue-500 text-white px-3 py-1 rounded-3xl hover:bg-blue-600 text-sm"
                      >
                        + Add Question
                      </button>
                    </div>

                    <div className="space-y-3">
                      {lesson.examQuestions.map((question, qIndex) => (
                        <div key={qIndex} className="border border-gray-200 rounded-3xl p-3">
                          <div className="grid gap-3 md:grid-cols-2">
                            <div>
                              <label className="block text-sm font-medium text-gray-700">Question</label>
                              <input
                                type="text"
                                value={question.questionText}
                                onChange={(e) => handleLessonExamQuestionChange(index, qIndex, 'questionText', e.target.value)}
                                placeholder="Enter question"
                                className="mt-1 w-full rounded-3xl border border-gray-300 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-primary-orange"
                              />
                            </div>
                            <div>
                              <label className="block text-sm font-medium text-gray-700">Type</label>
                              <select
                                value={question.type}
                                onChange={(e) => handleLessonExamQuestionChange(index, qIndex, 'type', e.target.value)}
                                className="mt-1 w-full rounded-3xl border border-gray-300 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-primary-orange"
                              >
                                <option value="mcq">Multiple Choice</option>
                                <option value="short">Short Answer</option>
                              </select>
                            </div>
                          </div>

                          {question.type === 'mcq' && (
                            <div className="mt-3">
                              <label className="block text-sm font-medium text-gray-700">Options</label>
                              <div className="grid gap-2 md:grid-cols-2">
                                {question.options.map((option, oIndex) => (
                                  <input
                                    key={oIndex}
                                    type="text"
                                    value={option}
                                    onChange={(e) => handleLessonExamQuestionOptionChange(index, qIndex, oIndex, e.target.value)}
                                    placeholder={`Option ${oIndex + 1}`}
                                    className="w-full rounded-3xl border border-gray-300 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-primary-orange"
                                  />
                                ))}
                              </div>
                            </div>
                          )}

                          <div className="mt-3">
                            <label className="block text-sm font-medium text-gray-700">Correct Answer</label>
                            <input
                              type="text"
                              value={question.correctAnswer}
                              onChange={(e) => handleLessonExamQuestionChange(index, qIndex, 'correctAnswer', e.target.value)}
                              placeholder="Enter correct answer"
                              className="mt-1 w-full rounded-3xl border border-gray-300 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-primary-orange"
                            />
                          </div>

                          {lesson.examQuestions.length > 1 && (
                            <button
                              type="button"
                              onClick={() => removeLessonExamQuestion(index, qIndex)}
                              className="mt-3 bg-red-500 text-white px-3 py-1 rounded hover:bg-red-600 text-sm"
                            >
                              Remove Question
                            </button>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div>
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-semibold">Final Certification Exam</h2>
              <button
                type="button"
                onClick={addFinalExamQuestion}
                className="bg-primary-orange text-white px-4 py-2 rounded-3xl hover:bg-primary-brown"
              >
                + Add Question
              </button>
            </div>
            <p className="text-sm text-gray-600 mb-4">Students must score 95% or higher on this exam to receive a certificate.</p>

            <div className="space-y-4">
              {finalExamQuestions.map((question, qIndex) => (
                <div key={qIndex} className="border border-gray-300 rounded-3xl p-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Question</label>
                    <input
                      type="text"
                      value={question.questionText}
                      onChange={(e) => handleFinalExamQuestionChange(qIndex, 'questionText', e.target.value)}
                      placeholder="Enter question"
                      className="mt-1 w-full rounded-3xl border border-gray-300 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-primary-orange"
                    />
                  </div>

                  <div className="mt-4">
                    <label className="block text-sm font-medium text-gray-700">Type</label>
                    <select
                      value={question.type}
                      onChange={(e) => handleFinalExamQuestionChange(qIndex, 'type', e.target.value)}
                      className="mt-1 w-full rounded-3xl border border-gray-300 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-primary-orange"
                    >
                      <option value="mcq">Multiple Choice</option>
                      <option value="short">Short Answer</option>
                    </select>
                  </div>

                  {question.type === 'mcq' && (
                    <div className="mt-4 space-y-2">
                      <label className="block text-sm font-medium text-gray-700">Options</label>
                      {question.options.map((option, oIndex) => (
                        <input
                          key={oIndex}
                          type="text"
                          value={option}
                          onChange={(e) => handleFinalExamQuestionOptionChange(qIndex, oIndex, e.target.value)}
                          placeholder={`Option ${oIndex + 1}`}
                          className="w-full rounded-3xl border border-gray-300 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-primary-orange"
                        />
                      ))}
                    </div>
                  )}

                  <div className="mt-4">
                    <label className="block text-sm font-medium text-gray-700">Correct Answer</label>
                    <input
                      type="text"
                      value={question.correctAnswer}
                      onChange={(e) => handleFinalExamQuestionChange(qIndex, 'correctAnswer', e.target.value)}
                      placeholder="Correct answer"
                      className="mt-1 w-full rounded-3xl border border-gray-300 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-primary-orange"
                    />
                  </div>

                  <button
                    type="button"
                    onClick={() => removeFinalExamQuestion(qIndex)}
                    className="mt-4 bg-red-500 text-white px-4 py-2 rounded hover:bg-red-600"
                  >
                    Remove Question
                  </button>
                </div>
              ))}
            </div>
          </div>

          <div className="flex gap-4">
            <button
              type="submit"
              disabled={loading}
              className="flex-1 bg-primary-brown text-white px-6 py-3 rounded-3xl hover:bg-primary-brown/90 disabled:opacity-50"
            >
              {loading ? 'Saving...' : isEditing ? 'Update Tutorial' : 'Create Tutorial'}
            </button>
            <button
              type="button"
              onClick={() => navigate('/seller-dashboard')}
              className="flex-1 bg-gray-400 text-white px-6 py-3 rounded-3xl hover:bg-gray-500"
            >
              Cancel
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default UploadTutorial;
