import { useState, useEffect, useCallback, useMemo } from 'react';
import { ListingService } from '../services/listingService';
import { UserService } from '../services/userService';
import { useAuthStore } from '../store/authStore.js';

export const useDashboardData = () => {
  // Get current user for user change detection

  const { token } = useAuthStore();
  const getCurrentUser = () => UserService.getCurrentUser(token);
  const [currentUserId, setCurrentUserId] = useState(
    getCurrentUser()?.user_id || null
  );

  // Store ALL listings (unfiltered) for client-side filtering - NO CACHING
  const [allListings, setAllListings] = useState([]);
  const [allMyListings, setAllMyListings] = useState([]);
  const [loading, setLoading] = useState(true); // Always start with loading since no cache
  const [searchLoading, setSearchLoading] = useState(false); // Separate loading state for search
  const [error, setError] = useState(null);
  const [activeCategory, setActiveCategory] = useState('all');
  const [sortBy, setSortBy] = useState('newest');
  const [searchTerm, setSearchTerm] = useState('');
  const [lastFetchParams, setLastFetchParams] = useState(null);
  const [isInitialized, setIsInitialized] = useState(false);

  // NO MORE CACHING - Data is always fresh from server
  const cacheData = useCallback(() => {
    // Removed caching for real-time data accuracy
    console.log('� Caching disabled - using fresh data only');
  }, []);

  // Transform API listing data to match ProductCard component expectations
  const transformListing = (listing) => {
    const hasRange =
      listing.price_min !== null &&
      listing.price_max !== null &&
      listing.price_min !== listing.price_max;

    return {
      // Original API data for reference
      ...listing,

      // Transformed data for ProductCard component
      id: listing.listing_id,
      productName: listing.name,
      productPrice: listing.price_min,
      priceRange: hasRange
        ? {
            min: listing.price_min,
            max: listing.price_max,
          }
        : null,
      hasPriceRange: hasRange,
      username: listing.user_profile?.username || listing.seller_username,
      userAvatar:
        listing.seller_profile_photo_url ||
        'https://via.placeholder.com/40x40?text=User',
      productImage:
        listing.images && listing.images.length > 0
          ? listing.images.find((img) => img.is_primary)?.image_url ||
            listing.images[0].image_url
          : 'https://via.placeholder.com/268x245?text=No+Image',
      images: listing.images || [],
      itemsOrdered: listing.sold_count || 0,

      // Additional data that might be needed
      category: listing.category,
      description: listing.description,
      status: listing.status,
      created_at: listing.created_at,
      tags: listing.tags,
    };
  };

  // Client-side sorting function
  const sortListings = useCallback((listingsToSort, sortOption) => {
    const sorted = [...listingsToSort];

    switch (sortOption) {
      case 'price_low_high':
        return sorted.sort(
          (a, b) => (a.productPrice || 0) - (b.productPrice || 0)
        );
      case 'price_high_low':
        return sorted.sort(
          (a, b) => (b.productPrice || 0) - (a.productPrice || 0)
        );
      case 'name_a_z':
        return sorted.sort((a, b) =>
          (a.productName || '').localeCompare(b.productName || '')
        );
      case 'name_z_a':
        return sorted.sort((a, b) =>
          (b.productName || '').localeCompare(a.productName || '')
        );
      case 'date_oldest':
        return sorted.sort(
          (a, b) => new Date(a.created_at) - new Date(b.created_at)
        );
      case 'newest':
      default:
        return sorted.sort(
          (a, b) => new Date(b.created_at) - new Date(a.created_at)
        );
    }
  }, []);

  // Client-side filtering function
  const filterListings = useCallback((listingsToFilter, category) => {
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
        listing.description || '',
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
    let filtered = filterListings(allListings, activeCategory);
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
    let filtered = filterListings(allMyListings, activeCategory);
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

  // Convert sort option to API parameters (for server-side sorting when fetching new data)
  const getSortParams = (sortOption) => {
    return {
      sort_by: sortOption,
    };
  };

  // Fetch fresh data - always gets latest from server
  const fetchData = useCallback(
    async (isSearchOperation = false) => {
      const currentParams = { searchTerm };

      console.log(
        '📊 Fetching fresh data - searchTerm:',
        searchTerm,
        'isSearch:',
        isSearchOperation
      );

      // Use search loading for search operations, main loading for initial load
      if (isSearchOperation) {
        setSearchLoading(true);
      } else {
        setLoading(true);
      }
      setError(null);

      try {
        const publicParams = {
          // Include search term if it exists, otherwise fetch all
          ...(searchTerm ? { search: searchTerm } : {}),
          ...getSortParams(sortBy),
        };

        const myParams = {
          ...(searchTerm ? { search: searchTerm } : {}),
          sort_by: sortBy,
        };

        const [publicResponse, myResponse] = await Promise.all([
          ListingService.getPublicListings(publicParams),
          ListingService.getMyListings(myParams),
        ]);

        // Transform and store listings
        let newAllListings = [];
        if (publicResponse.products) {
          newAllListings = publicResponse.products.map(transformListing);
        }

        let newAllMyListings = [];
        if (myResponse.products) {
          newAllMyListings = myResponse.products.map(transformListing);
        }

        // Update the complete dataset
        setAllListings(newAllListings);
        setAllMyListings(newAllMyListings);
        setLastFetchParams(currentParams);
        setIsInitialized(true);

        console.log('✅ Fresh data loaded:', {
          publicCount: newAllListings.length,
          myCount: newAllMyListings.length,
        });
      } catch (err) {
        console.error('Error fetching data:', err);
        setError('Failed to fetch data');
        setAllListings([]);
        setAllMyListings([]);
      } finally {
        if (isSearchOperation) {
          setSearchLoading(false);
        } else {
          setLoading(false);
        }
      }
    },
    [searchTerm, sortBy, getSortParams, transformListing]
  );

  // Refresh data with search detection
  const refreshData = useCallback(async () => {
    const currentParams = { searchTerm };
    const paramsChanged =
      JSON.stringify(currentParams) !== JSON.stringify(lastFetchParams);

    if (!isInitialized || paramsChanged) {
      await fetchData(isInitialized && paramsChanged); // Pass true if it's a search operation
    } else {
      console.log('📋 No refresh needed, params unchanged');
    }
  }, [fetchData, isInitialized, lastFetchParams, searchTerm]);

  // Force refresh - always fetches new data
  const forceRefresh = useCallback(async () => {
    console.log('🔄 Force refresh requested');
    setIsInitialized(false); // Reset initialization to force fetch
    await fetchData(false);
  }, [fetchData]);

  // Home/Logo refresh - resets filters and forces fresh data
  const refreshHome = useCallback(async () => {
    console.log(
      '🏠 Home refresh - resetting all filters and fetching fresh data'
    );

    // Reset all filters
    setActiveCategory('all');
    setSearchTerm('');
    setSortBy('newest');
    setIsInitialized(false);

    // Fetch fresh data with clean state
    await fetchData(false);

    console.log('🏠 Home refresh completed');
  }, [fetchData]);

  // Monitor user changes and reset data when user changes
  useEffect(() => {
    const checkUserChange = () => {
      const newUser = getCurrentUser();
      const newUserId = newUser?.user_id || null;

      if (currentUserId !== newUserId) {
        console.log('👤 User changed:', {
          oldUserId: currentUserId,
          newUserId: newUserId,
        });

        // Reset all state when user changes (including logout)
        console.log('🔄 Resetting state for user change...');
        setAllListings([]);
        setAllMyListings([]);
        setActiveCategory('all');
        setSortBy('newest');
        setSearchTerm('');
        setLastFetchParams(null);
        setIsInitialized(false);
        setLoading(true);
        setError(null);

        // Update current user ID
        setCurrentUserId(newUserId);

        console.log('✅ State reset for user change');
      }
    };

    // Check immediately and then periodically
    checkUserChange();
    const interval = setInterval(checkUserChange, 1000); // Check every second

    return () => clearInterval(interval);
  }, [currentUserId, getCurrentUser]);

  // Initial data load and search term changes
  useEffect(() => {
    if (currentUserId) {
      // Only fetch if there's a current user
      refreshData();
    }
  }, [refreshData, currentUserId]);

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
    refreshData: forceRefresh, // Export forceRefresh as refreshData for backward compatibility
    refreshHome, // New function for home/logo refresh
    clearCache: () => {
      // Since we don't use cache anymore, this just resets state
      console.log('🧹 Clearing state (no cache to clear)...');
      setAllListings([]);
      setAllMyListings([]);
      setActiveCategory('all');
      setSortBy('newest');
      setSearchTerm('');
      setLastFetchParams(null);
      setIsInitialized(false);
      console.log('✅ State cleared');
    },
    hasData: filteredListings.length > 0 || filteredMyListings.length > 0,
  };
};

export default useDashboardData;
