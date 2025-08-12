import { useCallback, useMemo } from 'react';
import { usePublicListings, useMyListings } from './queries/useListingQueries';
import { useAuthStore } from '../store/authStore.js';
import { useDashboardStore } from '../store/dashboardStore.js';
import { UserService } from '../services';

export const useDashboardData = () => {
  // Get current user for user change detection
  const { token, isAuthenticated, userID } = useAuthStore();
  const {
    activeCategory,
    setActiveCategory,
    sortBy,
    setSortBy,
    searchTerm,
    setSearchTerm,
  } = useDashboardStore();

  // Check if user is actually authenticated
  const isUserAuthenticated = isAuthenticated && token && UserService.isAuthenticated();

  // Build query parameters based on current state (exclude sort_by for client-side sorting)
  const publicParams = useMemo(
    () => ({
      ...(searchTerm ? { search: searchTerm } : {}),
      // Remove sort_by from API params - we'll handle sorting client-side
    }),
    [searchTerm] // Remove sortBy from dependencies
  );

  const myParams = useMemo(
    () => ({
      ...(searchTerm ? { search: searchTerm } : {}),
      // Remove sort_by from API params - we'll handle sorting client-side
    }),
    [searchTerm] // Remove sortBy from dependencies
  );

  // Use TanStack Query hooks - only enabled when authenticated
  const {
    data: allListings = [],
    isLoading: publicLoading,
    isError: publicError,
    error: publicErrorDetails,
    refetch: refetchPublic,
    isFetching: publicFetching,
  } = usePublicListings(publicParams, isUserAuthenticated);

  const {
    data: allMyListings = [],
    isLoading: myLoading,
    isError: myError,
    error: myErrorDetails,
    refetch: refetchMy,
    isFetching: myFetching,
  } = useMyListings(myParams, token);

  // Data is already transformed by the query hooks using formattedListing
  // No additional transformation needed

  // Loading and error states
  const loading = publicLoading || myLoading;
  const searchLoading = publicFetching || myFetching;
  const error =
    publicError || myError
      ? publicErrorDetails?.message ||
        myErrorDetails?.message ||
        'Failed to fetch listings'
      : null;

  // Client-side sorting function
  const sortListings = useCallback((listingsToSort, sortOption) => {
    // Reduced logging frequency - only log when there are items and not during rapid re-renders
    if (listingsToSort.length > 0 && import.meta.env.DEV) {
      console.log(`🔄 Sorted ${listingsToSort.length} items by: ${sortOption}`);
    }
    const sorted = [...listingsToSort];

    switch (sortOption) {
      case 'price_low_high':
        return sorted.sort((a, b) => {
          const priceA = a.priceRange ? a.priceRange.min : (a.productPrice || a.price_min || 0);
          const priceB = b.priceRange ? b.priceRange.min : (b.productPrice || b.price_min || 0);
          return priceA - priceB;
        });
      case 'price_high_low':
        return sorted.sort((a, b) => {
          const priceA = a.priceRange ? a.priceRange.min : (a.productPrice || a.price_min || 0);
          const priceB = b.priceRange ? b.priceRange.min : (b.productPrice || b.price_min || 0);
          return priceB - priceA;
        });
      case 'name_a_z':
        return sorted.sort((a, b) => {
          const nameA = (a.productName || a.name || '').toLowerCase();
          const nameB = (b.productName || b.name || '').toLowerCase();
          return nameA.localeCompare(nameB);
        });
      case 'name_z_a':
        return sorted.sort((a, b) => {
          const nameA = (a.productName || a.name || '').toLowerCase();
          const nameB = (b.productName || b.name || '').toLowerCase();
          return nameB.localeCompare(nameA);
        });
      case 'date_oldest':
        return sorted.sort((a, b) => {
          const dateA = new Date(a.created_at || a.date || 0);
          const dateB = new Date(b.created_at || b.date || 0);
          return dateA - dateB;
        });
      case 'newest':
      default:
        return sorted.sort((a, b) => {
          const dateA = new Date(a.created_at || a.date || 0);
          const dateB = new Date(b.created_at || b.date || 0);
          return dateB - dateA;
        });
    }
  }, []);

  // Client-side filtering function
  const filterListings = useCallback((listingsToFilter, category) => {
    // If category is 'all', return all listings
    if (category === 'all') {
      return listingsToFilter;
    }
    return listingsToFilter.filter(
      (listing) =>
        listing.category &&
        listing.category.toLowerCase() === category.toLowerCase()
    );
  }, []);

  // Client-side search function
  const searchListings = useCallback((listingsToSearch, query) => {
    // If no query or empty query, return all listings
    if (!query || query.trim().length === 0) {
      return listingsToSearch;
    }

    const searchQuery = query.toLowerCase().trim();
    return listingsToSearch.filter((listing) => {
      // Search in product name, description, tags, and seller name
      const searchableText = [
        listing.productName || '',
        listing.productDescription || '',
        listing.username || '',
        ...(listing.tags || []),
      ]
        .join(' ')
        .toLowerCase();

      return searchableText.includes(searchQuery);
    });
  }, []);

  // Get filtered and sorted listings - computed on demand
  const filteredListings = useMemo(() => {
    let filtered = filterListings(allListings || [], activeCategory);
    filtered = searchListings(filtered, searchTerm);
    return sortListings(filtered, sortBy);
  }, [
    allListings,
    activeCategory,
    searchTerm,
    filterListings,
    searchListings,
    sortBy,
    sortListings,
  ]);

  const filteredMyListings = useMemo(() => {
    let filtered = filterListings(allMyListings || [], activeCategory);
    filtered = searchListings(filtered, searchTerm);
    return sortListings(filtered, sortBy);
  }, [
    allMyListings,
    activeCategory,
    searchTerm,
    filterListings,
    searchListings,
    sortBy,
    sortListings,
  ]);

  // Refetch functions
  const refreshData = useCallback(async () => {
    console.log('🔄 Manual refresh triggered');
    await Promise.all([refetchPublic(), refetchMy()]);
  }, [refetchPublic, refetchMy]);

  const refreshHome = useCallback(async () => {
    console.log('🏠 Home refresh - resetting filters and refetching');

    // Reset all filters
    setActiveCategory('all');
    setSearchTerm('');
    setSortBy('newest');

    // Refetch data
    await Promise.all([refetchPublic(), refetchMy()]);
  }, [refetchPublic, refetchMy]);

  return {
    listings: filteredListings, // Return filtered and sorted data
    myListings: filteredMyListings, // Return filtered and sorted data
    loading,
    searchLoading, // Export search loading state
    error,
    activeCategory,
    setActiveCategory,
    sortBy,
    setSortBy,
    searchTerm,
    setSearchTerm,
    refreshData, // Manual refresh function
    refreshHome, // Home/logo refresh function
    clearCache: () => {
      // With TanStack Query, we don't need to manually clear cache
      // The query client handles this automatically
      console.log('🧹 Cache clearing handled by TanStack Query');
    },
    hasData: filteredListings.length > 0 || filteredMyListings.length > 0,
  };
};

export default useDashboardData;
