// context/SearchContext.jsx
import React, { createContext, useContext, useState } from 'react';

const SearchContext = createContext();

export const SearchProvider = ({ children }) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [filters, setFilters] = useState({
    category: '',
    minPrice: 0,
    maxPrice: 1000,
    sortBy: 'name',
    sortOrder: 'asc'
  });

  const updateSearchQuery = (query) => {
    setSearchQuery(query);
  };

  const updateFilters = (newFilters) => {
    setFilters(prev => ({ ...prev, ...newFilters }));
  };

  const clearAllFilters = () => {
    setSearchQuery('');
    setFilters({
      category: '',
      minPrice: 0,
      maxPrice: 1000,
      sortBy: 'name',
      sortOrder: 'asc'
    });
  };

  const value = {
    searchQuery,
    filters,
    updateSearchQuery,
    updateFilters,
    clearAllFilters
  };

  return (
    <SearchContext.Provider value={value}>
      {children}
    </SearchContext.Provider>
  );
};

export const useSearch = () => {
  const context = useContext(SearchContext);
  if (!context) {
    throw new Error('useSearch must be used within a SearchProvider');
  }
  return context;
};