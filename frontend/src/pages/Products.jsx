import React, { useState, useEffect } from 'react';
import { useLocation, useParams, Link } from 'react-router-dom';
import ProductCard from '../components/product/ProductCard';
import TutorialCard from '../components/tutorial/TutorialCard';
import apiService from '../services/api';
import { useCart } from '../context/CartContext';

// SearchBar Component
const SearchBar = ({ searchQuery, updateSearchQuery, filters }) => {
  const [localQuery, setLocalQuery] = useState(searchQuery);

  const handleSubmit = (e) => {
    e.preventDefault();
    updateSearchQuery(localQuery);
  };

  const handleClear = () => {
    setLocalQuery('');
    updateSearchQuery('');
  };

  return (
    <div className="w-full max-w-2xl mx-auto">
      <form onSubmit={handleSubmit} className="relative">
        <input
          type="text"
          value={localQuery}
          onChange={(e) => setLocalQuery(e.target.value)}
          placeholder={`Search for ${filters.type === 'tutorials' ? 'tutorials, courses' : 'crafts, products'}, artisans...`}
          className="w-full px-6 py-4 pr-12 border border-gray-300 rounded-2xl focus:outline-none focus:ring-2 focus:ring-primary-orange focus:border-transparent text-lg shadow-sm"
        />
        <div className="absolute right-3 top-1/2 transform -translate-y-1/2 flex space-x-2">
          {localQuery && (
            <button type="button" onClick={handleClear} className="text-gray-400 hover:text-gray-600">
              ✕
            </button>
          )}
          <button type="submit" className="text-primary-orange hover:text-primary-brown">
            🔍
          </button>
        </div>
      </form>
    </div>
  );
};

// FilterSidebar Component
const FilterSidebar = ({ filters, updateFilters, clearAllFilters, categories = [] }) => {
  const sortOptions = [
    { value: 'name', label: 'Name (A-Z)' },
    { value: '-name', label: 'Name (Z-A)' },
    { value: 'price', label: 'Price: Low to High' },
    { value: '-price', label: 'Price: High to Low' },
    { value: '-averageRating', label: 'Highest Rated' },
    { value: '-createdAt', label: 'Newest First' },
    { value: 'createdAt', label: 'Oldest First' }
  ];

  return (
    <div className="sticky top-6 w-full max-w-[17rem] rounded-[24px] border border-orange-100 bg-white p-5 shadow-[0_14px_32px_rgba(148,90,36,0.10)]">
      <div className="mb-5 flex items-center justify-between">
        <h3 className="text-base font-bold text-primary-brown">Filters</h3>
        <button onClick={clearAllFilters} className="text-xs font-medium text-primary-orange hover:text-primary-brown">
          Clear All
        </button>
      </div>

      {/* Type Filter */}
      <div className="mb-5">
        <h4 className="mb-2 text-sm font-semibold text-gray-700">Type</h4>
        <select
          value={filters.type}
          onChange={(e) => updateFilters({ type: e.target.value })}
          className="w-full rounded-lg border border-gray-300 px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary-orange"
        >
          <option value="products">Products</option>
          <option value="tutorials">Tutorials</option>
        </select>
      </div>

      <div className="mb-5">
        <h4 className="mb-2 text-sm font-semibold text-gray-700">Category</h4>
        <select
          value={filters.category}
          onChange={(e) => updateFilters({ category: e.target.value })}
          className="w-full rounded-lg border border-gray-300 px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary-orange"
        >
          <option value="">All Categories</option>
          {(categories || []).map(category => (
            <option key={category._id || category} value={category._id || category}>
              {category.name || category}
            </option>
          ))}
        </select>
      </div>

      <div className="mb-5">
        <h4 className="mb-2 text-sm font-semibold text-gray-700">Price Range</h4>
        <div className="space-y-3">
          <div className="rounded-xl bg-orange-50/60 p-2.5">
            <label className="mb-2 block text-xs text-gray-600">Min: ${filters.minPrice}</label>
            <input
              type="range"
              min="0"
              max="500"
              step="10"
              value={filters.minPrice}
              onChange={(e) => updateFilters({ minPrice: parseInt(e.target.value) })}
              className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer"
            />
          </div>
          <div className="rounded-xl bg-orange-50/60 p-2.5">
            <label className="mb-2 block text-xs text-gray-600">Max: ${filters.maxPrice}</label>
            <input
              type="range"
              min="0"
              max="500"
              step="10"
              value={filters.maxPrice}
              onChange={(e) => updateFilters({ maxPrice: parseInt(e.target.value) })}
              className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer"
            />
          </div>
        </div>
      </div>

      <div>
        <h4 className="mb-2 text-sm font-semibold text-gray-700">Sort By</h4>
        <select
          value={filters.sortBy}
          onChange={(e) => updateFilters({ sortBy: e.target.value })}
          className="w-full rounded-lg border border-gray-300 px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary-orange"
        >
          {sortOptions.map(option => (
            <option key={option.value} value={option.value}>{option.label}</option>
          ))}
        </select>
      </div>
    </div>
  );
};

const Products = () => {
  const location = useLocation();
  const { categoryId } = useParams();
  const [products, setProducts] = useState([]);
  const [tutorials, setTutorials] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [pagination, setPagination] = useState({ page: 1, limit: 12, total: 0, pages: 0 });
  const [searchQuery, setSearchQuery] = useState('');
  const [filters, setFilters] = useState({ category: '', minPrice: 0, maxPrice: 500, sortBy: '-createdAt', type: 'products' });

  const { getCartTotalItems } = useCart();

  // Fetch filter options safely
  useEffect(() => {
    const fetchFilterOptions = async () => {
      try {
        const categoriesResponse = await apiService.getCategories();
        setCategories(Array.isArray(categoriesResponse) ? categoriesResponse : (categoriesResponse?.data || []));
      } catch (err) {
        console.error("Error fetching filter options:", err.message || err);
        setCategories([]);
      }
    };
    fetchFilterOptions();
  }, []);

  // Validate category filter
  useEffect(() => {
    if (categories.length > 0 && filters.category && !categories.find(c => c._id === filters.category)) {
      setFilters(prev => ({ ...prev, category: '' }));
    }
  }, [categories, filters.category]);

  // Load filter values from URL query string when landing on /products
  useEffect(() => {
    const params = new URLSearchParams(location.search);
    const category = categoryId || params.get('category') || '';
    const search = params.get('search') || '';
    const minPrice = params.get('minPrice') ? parseInt(params.get('minPrice'), 10) : 0;
    const maxPrice = params.get('maxPrice') ? parseInt(params.get('maxPrice'), 10) : 500;
    const sortBy = params.get('sortBy') || '-createdAt';
    const type = params.get('type') || 'products';

    setFilters(prev => ({
      ...prev,
      category,
      minPrice: Number.isNaN(minPrice) ? 0 : minPrice,
      maxPrice: Number.isNaN(maxPrice) ? 500 : maxPrice,
      sortBy,
      type
    }));
    setSearchQuery(search);
    setPagination(prev => ({ ...prev, page: 1 }));
  }, [location.search, categoryId]);

  // Fetch products safely
  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        setError(null);

        if (filters.type === 'tutorials') {
          // Fetch tutorials
          const params = { sort: filters.sortBy };
          if (filters.category) params.category = filters.category;
          if (searchQuery) params.search = searchQuery;

          const response = await apiService.getTutorials(params);
          const tutorialsData = response?.data || response?.tutorials || [];
          setTutorials(tutorialsData);
          setProducts([]);
          setPagination(prev => ({
            ...prev,
            total: response?.total || tutorialsData.length,
            pages: response?.pages || Math.ceil((response?.total || tutorialsData.length) / prev.limit)
          }));
        } else {
          // Fetch products
          if (categoryId && !searchQuery && filters.minPrice === 0 && filters.maxPrice === 500 && filters.sortBy === '-createdAt') {
            // Use specific category endpoint
            const response = await apiService.getProductsByCategory(categoryId);
            const productsData = response?.data?.data || response?.data || [];
            setProducts(productsData);
            setTutorials([]);
            setPagination(prev => ({ ...prev, total: productsData.length, pages: 1 }));
          } else {
            // Use general products endpoint
            const params = { page: pagination.page, limit: pagination.limit, sort: filters.sortBy };
            if (filters.category) params.category = filters.category;
            if (filters.minPrice > 0) params.minPrice = filters.minPrice;
            if (filters.maxPrice < 500) params.maxPrice = filters.maxPrice;
            if (searchQuery) params.search = searchQuery;

            const response = await apiService.getProducts(params);

            const productsData = response?.data?.data || response?.products || response?.data || [];
            setProducts(productsData);
            setTutorials([]);

            setPagination(prev => ({
              ...prev,
              total: response?.total || productsData.length,
              pages: response?.pages || Math.ceil((response?.total || productsData.length) / prev.limit)
            }));
          }
        }
      } catch (err) {
        console.error('Error fetching data:', err.message || err);
        setError(err.message || 'Failed to load data');
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [filters, searchQuery, pagination.page, categoryId]);

  const updateSearchQuery = (query) => {
    setSearchQuery(query);
    setPagination(prev => ({ ...prev, page: 1 }));
  };

  const updateFilters = (newFilters) => {
    setFilters(prev => {
      const next = {
        ...prev,
        ...newFilters
      };

      if (newFilters.minPrice !== undefined && newFilters.minPrice > next.maxPrice) {
        next.maxPrice = newFilters.minPrice;
      }
      if (newFilters.maxPrice !== undefined && newFilters.maxPrice < next.minPrice) {
        next.minPrice = newFilters.maxPrice;
      }

      next.minPrice = Math.max(0, Math.min(500, next.minPrice));
      next.maxPrice = Math.max(0, Math.min(500, next.maxPrice));

      return next;
    });
    setPagination(prev => ({ ...prev, page: 1 }));
  };

  const clearAllFilters = () => {
    setSearchQuery('');
    setFilters({ category: '', minPrice: 0, maxPrice: 500, sortBy: '-createdAt', type: 'products' });
    setPagination(prev => ({ ...prev, page: 1 }));
  };

  const handlePageChange = (newPage) => {
    setPagination(prev => ({ ...prev, page: newPage }));
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  if (loading && products.length === 0) {
    return (
      <div className="min-h-screen bg-gray-50 py-8 flex justify-center items-center">
        <div className="animate-spin rounded-full h-32 w-32 border-t-2 border-b-2 border-primary-orange"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="container mx-auto px-4">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-primary-brown mb-2">
            {filters.type === 'tutorials' ? 'Discover Tutorials & Courses' : 'Discover Handmade Crafts'}
          </h1>
          <p className="text-gray-600">
            {filters.type === 'tutorials' 
              ? 'Learn from expert Zimbabwean artisans and start your creative journey' 
              : 'Support local Zimbabwean artisans and their beautiful creations'
            }
          </p>
        </div>

        <div className="mb-10">
          <SearchBar searchQuery={searchQuery} updateSearchQuery={updateSearchQuery} filters={filters} />
        </div>

        {error && (
          <div className="bg-red-50 border-l-4 border-red-500 text-red-700 px-6 py-4 rounded-r-lg mb-6 shadow-sm">
            <div className="flex items-center">
              <span className="text-red-500 text-xl mr-3">⚠️</span>
              <div>
                <p className="font-semibold">Error</p>
                <p>{error}</p>
                <button onClick={() => setPagination(prev => ({ ...prev }))} className="text-red-600 underline mt-2 hover:text-red-800">Try Again</button>
              </div>
            </div>
          </div>
        )}

        <div className="flex flex-col gap-10 lg:flex-row lg:items-start">
          <div className="lg:w-[17rem] lg:flex-shrink-0">
            <FilterSidebar
              filters={filters}
              updateFilters={updateFilters}
              clearAllFilters={clearAllFilters}
              categories={categories}
            />
          </div>

          <div className="min-w-0 flex-1">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-2xl font-bold text-primary-brown">
                {pagination.total} {pagination.total === 1 ? (filters.type === 'tutorials' ? 'Tutorial' : 'Product') : (filters.type === 'tutorials' ? 'Tutorials' : 'Products')} Found
              </h2>
              {searchQuery && <p className="text-gray-600">Results for: "<span className="font-semibold">{searchQuery}</span>"</p>}
            </div>

            {products.length > 0 ? (
              <div className="grid grid-cols-1 gap-5 md:grid-cols-2 xl:grid-cols-3">
                {products.map(product => <ProductCard key={product._id} product={product} />)}
              </div>
            ) : tutorials.length > 0 ? (
              <div className="grid grid-cols-1 gap-5 md:grid-cols-2 xl:grid-cols-3">
                {tutorials.map((tutorial) => (
                  <TutorialCard key={tutorial._id} tutorial={tutorial} />
                ))}
              </div>
            ) : (
              <div className="text-center py-12">
                <div className="text-6xl mb-4">😔</div>
                <h3 className="text-xl font-semibold text-gray-600 mb-2">
                  {filters.category ? `No ${filters.type === 'tutorials' ? 'tutorials' : 'products'} found in the selected category` : `No ${filters.type === 'tutorials' ? 'tutorials' : 'products'} found`}
                </h3>
                <p className="text-gray-500 mb-4">
                  {filters.category ? 'Try selecting a different category or clear all filters.' : 'Try adjusting your search terms or filters.'}
                </p>
                <button onClick={clearAllFilters} className="bg-primary-orange hover:bg-primary-brown text-white py-2 px-6 rounded-lg transition-all duration-300">Clear All Filters</button>
              </div>
            )}
          </div>
        </div>

        {/* Floating Cart Icon */}
        <Link
          to="/cart"
          className="fixed bottom-6 right-6 bg-primary-orange hover:bg-primary-brown text-white p-4 rounded-full shadow-lg transition-all duration-300 transform hover:scale-110 z-50"
        >
          <div className="relative">
            🛒
            {getCartTotalItems() > 0 && (
              <span className="absolute -top-2 -right-2 bg-red-500 text-white text-xs rounded-full h-5 w-5 flex items-center justify-center">
                {getCartTotalItems()}
              </span>
            )}
          </div>
        </Link>
      </div>
    </div>
  );
};

export default Products;
