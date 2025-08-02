import { useState, useEffect, useCallback } from 'react';
import { ListingService } from '../services/listingService';

export const useDashboardData = () => {
  const [listings, setListings] = useState([]);
  const [myListings, setMyListings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [activeCategory, setActiveCategory] = useState('all');
  const [sortBy, setSortBy] = useState('newest');
  const [searchTerm, setSearchTerm] = useState('');

  // Convert sort option to API parameters
  const getSortParams = (sortOption) => {
    switch (sortOption) {
      case 'price_low_high':
        return { min_price: 0, max_price: undefined };
      case 'price_high_low':
        return { min_price: undefined, max_price: Infinity };
      case 'newest':
      default:
        return {};
    }
  };

  // Fetch public listings
  const fetchPublicListings = useCallback(async () => {
    try {
      const params = {
        category: activeCategory,
        search: searchTerm,
        ...getSortParams(sortBy)
      };
      
      const response = await ListingService.getPublicListings(params);
      if (response.success && response.data) {
        setListings(response.data.listings || []);
      } else {
        setListings([]);
      }
    } catch (err) {
      console.error('Error fetching public listings:', err);
      setError('Failed to load listings');
      setListings([]);
    }
  }, [activeCategory, searchTerm, sortBy]);

  // Fetch user's own listings
  const fetchMyListings = useCallback(async () => {
    try {
      const params = {
        category: activeCategory,
        search: searchTerm
      };
      
      const response = await ListingService.getMyListings(params);
      if (response.success && response.data) {
        setMyListings(response.data.listings || []);
      } else {
        setMyListings([]);
      }
    } catch (err) {
      console.error('Error fetching my listings:', err);
      // Don't set error for my listings as user might not be authenticated
      setMyListings([]);
    }
  }, [activeCategory, searchTerm]);

  // Refresh all data
  const refreshData = useCallback(async () => {
    setLoading(true);
    setError(null);
    
    try {
      await Promise.all([
        fetchPublicListings(),
        fetchMyListings()
      ]);
    } catch (err) {
      console.error('Error refreshing data:', err);
      setError('Failed to refresh data');
    } finally {
      setLoading(false);
    }
  }, [fetchPublicListings, fetchMyListings]);

  // Initial data load
  useEffect(() => {
    refreshData();
  }, [refreshData]);

  // Refetch when filters change
  useEffect(() => {
    if (!loading) {
      fetchPublicListings();
      fetchMyListings();
    }
  }, [activeCategory, searchTerm, sortBy, fetchPublicListings, fetchMyListings, loading]);

  return {
    listings,
    myListings,
    loading,
    error,
    activeCategory,
    setActiveCategory,
    sortBy,
    setSortBy,
    searchTerm,
    setSearchTerm,
    refreshData
  };
};

export default useDashboardData;
