// components/FilterSidebar.jsx
import React from 'react';
import { useSearch } from '../context/SearchContext';

const FilterSidebar = () => {
  const { filters, updateFilters, clearAllFilters } = useSearch();

  const categories = [
    'All Categories',
    'Pottery',
    'Basketry',
    'Textiles',
    'Jewelry',
    'Wood Carving',
    'Stone Sculpture',
    'Metal Work',
    'Traditional Art'
  ];

  const sortOptions = [
    { value: 'name', label: 'Name (A-Z)' },
    { value: 'name_desc', label: 'Name (Z-A)' },
    { value: 'price_low', label: 'Price: Low to High' },
    { value: 'price_high', label: 'Price: High to Low' },
    { value: 'date_new', label: 'Newest First' },
    { value: 'date_old', label: 'Oldest First' }
  ];

  return (
    <div className="bg-white rounded-2xl shadow-lg p-6 sticky top-4">
      {/* Header */}
      <div className="flex justify-between items-center mb-6">
        <h3 className="text-lg font-bold text-primary-brown">Filters</h3>
        <button
          onClick={clearAllFilters}
          className="text-sm text-primary-orange hover:text-primary-brown transition-colors"
        >
          Clear All
        </button>
      </div>

      {/* Category Filter */}
      <div className="mb-6">
        <h4 className="font-semibold text-gray-700 mb-3">Category</h4>
        <select
          value={filters.category}
          onChange={(e) => updateFilters({ category: e.target.value })}
          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-orange"
        >
          {categories.map(category => (
            <option key={category} value={category === 'All Categories' ? '' : category}>
              {category}
            </option>
          ))}
        </select>
      </div>

      {/* Price Range Filter */}
      <div className="mb-6">
        <h4 className="font-semibold text-gray-700 mb-3">
          Price Range: ${filters.minPrice} - ${filters.maxPrice}
        </h4>
        <div className="space-y-2">
          <input
            type="range"
            min="0"
            max="1000"
            value={filters.minPrice}
            onChange={(e) => updateFilters({ minPrice: parseInt(e.target.value) })}
            className="w-full"
          />
          <input
            type="range"
            min="0"
            max="1000"
            value={filters.maxPrice}
            onChange={(e) => updateFilters({ maxPrice: parseInt(e.target.value) })}
            className="w-full"
          />
        </div>
        <div className="flex justify-between text-sm text-gray-600 mt-2">
          <span>$0</span>
          <span>$1000</span>
        </div>
      </div>

      {/* Sort Options */}
      <div>
        <h4 className="font-semibold text-gray-700 mb-3">Sort By</h4>
        <select
          value={filters.sortBy}
          onChange={(e) => updateFilters({ sortBy: e.target.value })}
          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-orange"
        >
          {sortOptions.map(option => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>
      </div>
    </div>
  );
};

export default FilterSidebar;