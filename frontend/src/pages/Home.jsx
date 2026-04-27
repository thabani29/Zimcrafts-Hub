import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import apiService from '../services/api';

const Home = () => {
  const [categories, setCategories] = useState([]);
  const [currentLinkIndex, setCurrentLinkIndex] = useState(0);
  const navigate = useNavigate();

  // Quick links data
  const quickLinks = [
    {
      icon: '🛍️',
      title: 'Shop Products',
      description: 'Explore our collection of authentic Zimbabwean artisan products',
      path: '/products',
      borderColor: 'hover:border-primary-orange',
      gradientFrom: 'from-primary-orange',
      gradientTo: 'to-orange-300',
      textHover: 'group-hover:text-primary-orange'
    },
    {
      icon: '🛒',
      title: 'Your Cart',
      description: 'View and manage your shopping cart',
      path: '/cart',
      borderColor: 'hover:border-primary-yellow',
      gradientFrom: 'from-primary-yellow',
      gradientTo: 'to-yellow-300',
      textHover: 'group-hover:text-primary-yellow'
    },
    {
      icon: '🎓',
      title: 'Learn & Grow',
      description: 'Access tutorials and courses from expert artisans',
      path: '/products?type=tutorials',
      borderColor: 'hover:border-green-500',
      gradientFrom: 'from-green-500',
      gradientTo: 'to-green-300',
      textHover: 'group-hover:text-green-600'
    }
  ];

  // Fetch categories from backend
  useEffect(() => {
    const loadHomeData = async () => {
      try {
        const categoriesResponse = await apiService.getCategories();

        setCategories(Array.isArray(categoriesResponse) ? categoriesResponse : (categoriesResponse?.data || []));
      } catch (err) {
        console.error('Error fetching home page data', err);
      }
    };

    loadHomeData();
  }, []);

  // Auto-rotate carousel every 5 seconds
  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentLinkIndex((prev) => (prev === quickLinks.length - 1 ? 0 : prev + 1));
    }, 5000);

    return () => clearInterval(interval);
  }, [quickLinks.length]);

  const handleCategoryClick = (category) => {
    const categoryName = category?.name?.toLowerCase?.() || '';
    const categorySlug = category?.slug?.toLowerCase?.() || '';

    if (categoryName === 'tutorials' || categorySlug === 'tutorials') {
      navigate('/products?type=tutorials');
      return;
    }

    navigate(`/products/category/${category._id}`);
  };

  const currentLink = quickLinks[currentLinkIndex];

  return (
    <div className="px-4 md:px-8 py-8">
      {/* Hero Banner Section with Quick Links Carousel */}
      <section className="mb-8">
        <div className="bg-gradient-to-r from-primary-orange to-orange-400 rounded-2xl px-4 md:px-6 py-6 md:py-8 relative overflow-hidden shadow-xl">
          {/* Decorative background elements */}
          <div className="absolute left-4 top-1/2 transform -translate-y-1/2 text-4xl opacity-10">◉</div>
          <div className="absolute right-4 top-1/2 transform -translate-y-1/2 text-4xl opacity-10">◉</div>
          
          <div className="relative z-10">
            {/* Header Text */}
            <div className="text-center mb-4">
              <h2 className="text-2xl md:text-3xl font-bold text-white mb-1">
                Support Local Communities
              </h2>
              <p className="text-primary-yellow font-semibold text-xs md:text-sm">
                Every purchase empowers Zimbabwean artisans
              </p>
            </div>
            
            {/* Quick Link Carousel */}
            <div className="flex items-center justify-center">
              {/* Link Card */}
              <Link
                to={currentLink.path}
                className="group flex-1 max-w-sm relative bg-gradient-to-br from-primary-orange to-orange-400 rounded-lg shadow-lg hover:shadow-xl transition-all duration-300 transform hover:scale-105 p-4 md:p-5 text-center cursor-pointer overflow-hidden border border-white border-opacity-20 hover:border-opacity-40"
              >
                <div className="absolute inset-0 bg-white opacity-0 group-hover:opacity-10 transition-all duration-300 rounded-xl" />
                <div className="relative z-10">
                  <div className="text-3xl md:text-4xl mb-2">{currentLink.icon}</div>
                  <h3 className="text-sm md:text-lg font-bold text-white mb-1 group-hover:text-primary-yellow transition-colors">
                    {currentLink.title}
                  </h3>
                  <p className="text-xs md:text-sm text-white text-opacity-90">
                    {currentLink.description}
                  </p>
                </div>
              </Link>
            </div>

            {/* Dot indicators - Primary Navigation */}
            <div className="flex justify-center space-x-2 mt-4">
              {quickLinks.map((_, index) => (
                <button
                  key={index}
                  onClick={() => setCurrentLinkIndex(index)}
                  className={`transition-all duration-300 rounded-full cursor-pointer hover:scale-125 ${
                    index === currentLinkIndex 
                      ? 'bg-white w-3 h-3 shadow-lg' 
                      : 'bg-white bg-opacity-50 hover:bg-opacity-80 w-2 h-2'
                  }`}
                  aria-label={`Go to link ${index + 1}`}
                />
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Search Bar */}
      <section className="mb-12">
        <div className="relative">
          <div className="flex items-center bg-white rounded-lg shadow-md p-3 border-2 border-gray-200 hover:border-primary-orange transition-colors">
            <span className="text-gray-400 text-xl mr-3">🔍</span>
            <input 
              type="text"
              placeholder="Search products, tutorials, artisans..."
              className="flex-1 outline-none text-gray-700 placeholder-gray-400"
              readOnly
              onClick={() => {
                // Redirect to products page when clicking on search
                window.location.href = '/products';
              }}
            />
          </div>
        </div>
      </section>

      {/* Categories Grid */}
      <section className="mb-12">
        <h3 className="text-3xl font-bold mb-8 text-primary-brown text-center animate-pulse">
          Browse Categories
        </h3>

        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
          {categories.map(category => (
            <div
              key={category._id}
              onClick={() => handleCategoryClick(category)}
              className="group relative bg-white rounded-2xl shadow-md hover:shadow-xl transition-all duration-500 transform hover:-translate-y-2 cursor-pointer overflow-hidden"
            >
              {/* Category Image */}
              <div className="h-40 md:h-48 bg-gray-100 flex items-center justify-center overflow-hidden">
                <img
                  src={category.image?.url || 'https://via.placeholder.com/300x200?text=No+Image'}
                  alt={category.name}
                  className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
                />
              </div>

              {/* Category Info */}
              <div className="p-4 bg-gradient-to-r from-primary-orange to-orange-300 text-white">
                <div className="flex items-center justify-between">
                  <h4 className="font-bold text-lg truncate group-hover:translate-x-1 transition-transform duration-300">
                    {category.name}
                  </h4>
                  <span className="text-2xl opacity-0 group-hover:opacity-100 transform group-hover:rotate-12 transition-all duration-300">
                    →
                  </span>
                </div>
                <p className="text-sm opacity-0 group-hover:opacity-100 max-h-0 group-hover:max-h-24 overflow-hidden mt-2 transition-all duration-500">
                  {category.description || ''}
                </p>
              </div>

              {/* Hover overlay */}
              <div className="absolute inset-0 bg-primary-brown bg-opacity-0 group-hover:bg-opacity-10 transition-all duration-300 rounded-2xl" />
            </div>
          ))}
        </div>
      </section>
    </div>
  );
};

export default Home;
