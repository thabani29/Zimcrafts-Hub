// components/SearchBar.jsx
import React, { useState } from 'react';
import { useSearch } from '../context/SearchContext';

const SearchBar = () => {
  const { searchQuery, updateSearchQuery } = useSearch();
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
        <div className="relative">
          <input
            type="text"
            value={localQuery}
            onChange={(e) => setLocalQuery(e.target.value)}
            placeholder="Search for crafts, products, artisans..."
            className="w-full px-6 py-4 pr-12 border border-gray-300 rounded-2xl focus:outline-none focus:ring-2 focus:ring-primary-orange focus:border-transparent text-lg shadow-sm"
          />
          <div className="absolute right-3 top-1/2 transform -translate-y-1/2 flex space-x-2">
            {localQuery && (
              <button
                type="button"
                onClick={handleClear}
                className="text-gray-400 hover:text-gray-600 transition-colors"
              >
                ✕
              </button>
            )}
            <button
              type="submit"
              className="text-primary-orange hover:text-primary-brown transition-colors"
            >
              🔍
            </button>
          </div>
        </div>
      </form>
    </div>
  );
};

export default SearchBar;