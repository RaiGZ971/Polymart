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

  // Transform API listing data to match ProductCard component expectations
  const transformListing = (listing) => {
    const hasRange = listing.price_min !== null && listing.price_max !== null && listing.price_min !== listing.price_max;
    
    return {
      // Original API data for reference
      ...listing,
      
      // Transformed data for ProductCard component
      id: listing.listing_id,
      productName: listing.name,
      productPrice: listing.price_min,
      priceRange: hasRange ? {
        min: listing.price_min,
        max: listing.price_max
      } : null,
      hasPriceRange: hasRange,
      username: listing.user_profile?.username || listing.seller_username,
      userAvatar: listing.seller_profile_photo_url || 'https://via.placeholder.com/40x40?text=User',
      productImage: listing.images && listing.images.length > 0 
        ? listing.images.find(img => img.is_primary)?.image_url || listing.images[0].image_url
        : 'https://via.placeholder.com/268x245?text=No+Image',
      images: listing.images || [],
      itemsOrdered: listing.sold_count || 0,
      
      // Additional data that might be needed
      category: listing.category,
      description: listing.description,
      status: listing.status,
      created_at: listing.created_at,
      tags: listing.tags
    };
  };

  // Convert sort option to API parameters
  const getSortParams = (sortOption) => {
    return {
      sort_by: sortOption
    };
  };

  // Fetch public listings
  const fetchPublicListings = useCallback(async () => {
    try {
      console.log('🔍 Fetching public listings with params:', {
        category: activeCategory,
        search: searchTerm,
        sort: sortBy
      });
      
      const params = {
        category: activeCategory,
        search: searchTerm,
        ...getSortParams(sortBy)
      };
      
      const response = await ListingService.getPublicListings(params);
      console.log('📦 Public listings response:', response);
      
      if (response.products) {
        const rawListings = response.products || [];
        const transformedListings = rawListings.map(transformListing);
        console.log('✅ Setting listings:', transformedListings.length, 'items');
        console.log('📝 Sample listing:', transformedListings[0]);
        setListings(transformedListings);
      } else {
        console.log('❌ No success or data in response');
        setListings([]);
      }
    } catch (err) {
      console.error('💥 Error fetching public listings:', err);
      setError('Failed to load listings');
      setListings([]);
    }
  }, [activeCategory, searchTerm, sortBy]);

  // Fetch user's own listings
  const fetchMyListings = useCallback(async () => {
    try {
      console.log('🔍 Fetching my listings with params:', {
        category: activeCategory,
        search: searchTerm,
        sort: sortBy
      });
      
      const params = {
        category: activeCategory,
        search: searchTerm,
        sort_by: sortBy
      };
      
      const response = await ListingService.getMyListings(params);
      console.log('📦 My listings response:', response);
      
      if (response.products) {
        const rawListings = response.products || [];
        const transformedListings = rawListings.map(transformListing);
        console.log('✅ Setting my listings:', transformedListings.length, 'items');
        console.log('📝 Sample my listing:', transformedListings[0]);
        setMyListings(transformedListings);
      } else {
        console.log('❌ No success or data in my listings response');
        setMyListings([]);
      }
    } catch (err) {
      console.error('💥 Error fetching my listings:', err);
      // Don't set error for my listings as user might not be authenticated
      setMyListings([]);
    }
  }, [activeCategory, searchTerm, sortBy]);

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
