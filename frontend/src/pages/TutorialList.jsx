import React, { useEffect, useState } from 'react';
import apiService from '../services/api';
import TutorialCard from '../components/tutorial/TutorialCard';

const TutorialList = () => {
  const [tutorials, setTutorials] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedCategory, setSelectedCategory] = useState('');

  useEffect(() => {
    const fetchCategories = async () => {
      try {
        const data = await apiService.getCategories();
        setCategories(Array.isArray(data) ? data : (data?.data || []));
      } catch (err) {
        console.error('Error fetching categories:', err);
      }
    };
    fetchCategories();
  }, []);

  useEffect(() => {
    const fetchTutorials = async () => {
      try {
        setLoading(true);
        setError(null);
        const params = {};
        if (selectedCategory) {
          params.category = selectedCategory;
          console.log('Filtering tutorials by category:', selectedCategory);
        } else {
          console.log('Fetching all tutorials');
        }
        const response = await apiService.getTutorials(params);
        console.log('Tutorials response:', response);
        const tutorialsData = response?.data || response?.tutorials || [];
        console.log('Parsed tutorials:', tutorialsData);
        setTutorials(tutorialsData);
      } catch (err) {
        console.error('Error loading tutorials:', err);
        setError(err.message || 'Unable to load tutorials');
      } finally {
        setLoading(false);
      }
    };
    fetchTutorials();
  }, [selectedCategory]);

  return (
    <div className="min-h-screen bg-gradient-to-b from-stone-50 via-white to-orange-50/40 py-10">
      <div className="container mx-auto px-4">
        <div className="mb-8 rounded-[28px] border border-orange-100 bg-white/90 p-6 shadow-[0_18px_40px_rgba(148,90,36,0.10)] backdrop-blur">
          <div className="flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">
            <div>
              <h1 className="text-3xl font-bold text-primary-brown">Tutorials & Courses</h1>
              <p className="mt-2 max-w-2xl text-gray-600">
                Browse lessons created by artisans and start learning today with the same warm, hands-on craft spirit as the marketplace.
              </p>
            </div>

            <div className="w-full max-w-sm">
              <label className="mb-2 block text-sm font-semibold text-gray-700">Filter by category</label>
              <select
                value={selectedCategory}
                onChange={(e) => setSelectedCategory(e.target.value)}
                className="w-full rounded-2xl border border-gray-300 bg-white px-4 py-3 text-sm shadow-sm transition-all duration-300 focus:outline-none focus:ring-2 focus:ring-primary-orange focus:border-transparent hover:border-orange-300"
              >
                <option value="">All Categories</option>
                {categories.map(category => (
                  <option key={category._id} value={category._id}>
                    {category.name}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="mt-5 flex flex-wrap gap-3 text-sm text-gray-600">
            <span className="rounded-full bg-orange-50 px-4 py-2 text-primary-orange">
              {tutorials.length} tutorial{tutorials.length === 1 ? '' : 's'} available
            </span>
            <span className="rounded-full bg-slate-100 px-4 py-2">
              Learn from Zimbabwean artisans
            </span>
          </div>
        </div>

        <div className="mb-8 flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-bold text-primary-brown">
              {selectedCategory ? 'Filtered Tutorials' : 'All Tutorials'}
            </h2>
            <p className="mt-1 text-sm text-gray-500">
              Tap a course card to explore the lessons, pricing, and enrollment details.
            </p>
          </div>
        </div>

        {loading ? (
          <div className="flex justify-center items-center py-20">
            <div className="animate-spin h-14 w-14 border-b-2 border-orange-500 rounded-full" />
          </div>
        ) : error ? (
          <div className="rounded-2xl border border-red-200 bg-red-50 px-6 py-5 text-red-700 shadow-sm">{error}</div>
        ) : tutorials.length === 0 ? (
          <div className="rounded-[28px] border border-gray-200 bg-white p-10 shadow-sm text-center">
            <h2 className="text-xl font-semibold mb-2 text-primary-brown">
              {selectedCategory ? 'No tutorials found in this category' : 'No tutorials available yet'}
            </h2>
            <p className="text-gray-600">
              {selectedCategory ? 'Try selecting a different category or browse all tutorials.' : 'Check back soon or ask a seller to publish a new course.'}
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-5 md:grid-cols-2 xl:grid-cols-3">
            {tutorials.map((tutorial) => (
              <TutorialCard key={tutorial._id} tutorial={tutorial} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default TutorialList;
