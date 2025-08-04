import { useState, useEffect, useCallback, useMemo } from 'react';
import { ListingService } from '../services/listingService';

export const useDashboardData = () => {
  // Try to load cached data from sessionStorage
  const loadCachedData = () => {
    try {
      const cached = sessionStorage.getItem('polymart_dashboard_data');
      if (cached) {
        const parsed = JSON.parse(cached);
        const cacheAge = Date.now() - parsed.timestamp;
        // Use cache if it's less than 5 minutes old
        if (cacheAge < 5 * 60 * 1000) {
          return parsed;
        }
      }
    } catch (err) {
      console.warn('Failed to load cached data:', err);
    }
    return null;
  };

  const cachedData = loadCachedData();
  
  // Store ALL listings (unfiltered) for client-side filtering
  const [allListings, setAllListings] = useState(cachedData?.allListings || []);
  const [allMyListings, setAllMyListings] = useState(cachedData?.allMyListings || []);
  const [loading, setLoading] = useState(!cachedData);
  const [searchLoading, setSearchLoading] = useState(false); // Separate loading state for search
  const [error, setError] = useState(null);
  const [activeCategory, setActiveCategory] = useState(cachedData?.activeCategory || 'all');
  const [sortBy, setSortBy] = useState(cachedData?.sortBy || 'newest');
  const [searchTerm, setSearchTerm] = useState(cachedData?.searchTerm || '');
  const [lastFetchParams, setLastFetchParams] = useState(cachedData?.lastFetchParams || null);
  const [isInitialized, setIsInitialized] = useState(!!cachedData);

    // Cache data to sessionStorage
  const cacheData = useCallback((newAllListings, newAllMyListings, params) => {
    try {
      const dataToCache = {
        allListings: newAllListings, // Store complete datasets
        allMyListings: newAllMyListings,
        activeCategory: activeCategory, // Store current category separately
        sortBy: sortBy, // Cache current sortBy separately
        searchTerm: params.searchTerm,
        lastFetchParams: params,
        timestamp: Date.now()
      };
      sessionStorage.setItem('polymart_dashboard_data', JSON.stringify(dataToCache));
    } catch (err) {
      console.warn('Failed to cache data:', err);
    }
  }, [activeCategory, sortBy]);

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

  // Client-side sorting function
  const sortListings = useCallback((listingsToSort, sortOption) => {
    const sorted = [...listingsToSort];
    
    switch (sortOption) {
      case 'price_low_high':
        return sorted.sort((a, b) => (a.productPrice || 0) - (b.productPrice || 0));
      case 'price_high_low':
        return sorted.sort((a, b) => (b.productPrice || 0) - (a.productPrice || 0));
      case 'name_a_z':
        return sorted.sort((a, b) => (a.productName || '').localeCompare(b.productName || ''));
      case 'name_z_a':
        return sorted.sort((a, b) => (b.productName || '').localeCompare(a.productName || ''));
      case 'date_oldest':
        return sorted.sort((a, b) => new Date(a.created_at) - new Date(b.created_at));
      case 'newest':
      default:
        return sorted.sort((a, b) => new Date(b.created_at) - new Date(a.created_at));
    }
  }, []);

    // Client-side filtering function
  const filterListings = useCallback((listingsToFilter, category) => {
    if (category === 'all') {
      return listingsToFilter;
    }
    return listingsToFilter.filter(listing => 
      listing.category && listing.category.toLowerCase() === category.toLowerCase()
    );
  }, []);

  // Client-side search function
  const searchListings = useCallback((listingsToSearch, query) => {
    // If no query or empty query, return all listings
    if (!query || query.trim().length === 0) {
      return listingsToSearch;
    }
    
    const searchQuery = query.toLowerCase().trim();
    return listingsToSearch.filter(listing => {
      // Search in product name, description, tags, and seller name
      const searchableText = [
        listing.productName || '',
        listing.description || '',
        listing.username || '',
        ...(listing.tags || [])
      ].join(' ').toLowerCase();
      
      return searchableText.includes(searchQuery);
    });
  }, []);

  // Get filtered and sorted listings - computed on demand
  const filteredListings = useMemo(() => {
    let filtered = filterListings(allListings, activeCategory);
    filtered = searchListings(filtered, searchTerm);
    return sortListings(filtered, sortBy);
  }, [allListings, activeCategory, searchTerm, filterListings, searchListings, sortBy, sortListings]);

  const filteredMyListings = useMemo(() => {
    let filtered = filterListings(allMyListings, activeCategory);
    filtered = searchListings(filtered, searchTerm);
    return sortListings(filtered, sortBy);
  }, [allMyListings, activeCategory, searchTerm, filterListings, searchListings, sortBy, sortListings]);

  // Convert sort option to API parameters (for server-side sorting when fetching new data)
  const getSortParams = (sortOption) => {
    return {
      sort_by: sortOption
    };
  };

  // Refresh all data with smart caching 
  const refreshData = useCallback(async () => {
    const currentParams = { searchTerm }; // Only search term triggers refetch, not category
    
    // Check if we need to refetch (only if search changed or we haven't initialized)
    const paramsChanged = JSON.stringify(currentParams) !== JSON.stringify(lastFetchParams);
    
    if (!isInitialized || paramsChanged) {
      console.log('📊 Refreshing data - initialized:', isInitialized, 'paramsChanged:', paramsChanged);
      
      // Use search loading for search operations, main loading for initial load
      if (isInitialized) {
        setSearchLoading(true);
      } else {
        setLoading(true);
      }
      setError(null);
      
      try {
        console.log('🔍 Fetching listings with search term:', searchTerm);
        
        const publicParams = {
          // Include search term if it exists, otherwise fetch all
          ...(searchTerm ? { search: searchTerm } : {}),
          ...getSortParams(sortBy)
        };
        
        const myParams = {
          ...(searchTerm ? { search: searchTerm } : {}),
          sort_by: sortBy
        };
        
        const [publicResponse, myResponse] = await Promise.all([
          ListingService.getPublicListings(publicParams),
          ListingService.getMyListings(myParams)
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
        setAllListings(prev => JSON.stringify(prev) !== JSON.stringify(newAllListings) ? newAllListings : prev);
        setAllMyListings(prev => JSON.stringify(prev) !== JSON.stringify(newAllMyListings) ? newAllMyListings : prev);
        
        // Cache the complete data
        cacheData(newAllListings, newAllMyListings, currentParams);
        
        setLastFetchParams(currentParams);
        setIsInitialized(true);
      } catch (err) {
        console.error('Error refreshing data:', err);
        setError('Failed to refresh data');
        setAllListings([]);
        setAllMyListings([]);
      } finally {
        if (isInitialized) {
          setSearchLoading(false);
        } else {
          setLoading(false);
        }
      }
    } else {
      console.log('📋 Using cached data, no refresh needed');
    }
  }, [searchTerm, isInitialized, lastFetchParams, sortBy, getSortParams, transformListing, cacheData]);

  // Force refresh - always fetches new data
  const forceRefresh = useCallback(async () => {
    setLoading(true);
    setError(null);
    setIsInitialized(false); // Reset initialization to force fetch
    
    try {
      const currentParams = { searchTerm };
      
      console.log('🔄 Force refreshing data with search term:', searchTerm);
      
      const publicParams = {
        // Include search term if it exists, otherwise fetch all
        ...(searchTerm ? { search: searchTerm } : {}),
        ...getSortParams(sortBy)
      };
      
      const myParams = {
        ...(searchTerm ? { search: searchTerm } : {}),
        sort_by: sortBy
      };
      
      const [publicResponse, myResponse] = await Promise.all([
        ListingService.getPublicListings(publicParams),
        ListingService.getMyListings(myParams)
      ]);
      
      // Transform and store listings
      let newAllListings = [];
      if (publicResponse.products) {
        newAllListings = publicResponse.products.map(transformListing);
      }
      
      // Transform my listings
      let newAllMyListings = [];
      if (myResponse.products) {
        newAllMyListings = myResponse.products.map(transformListing);
      }
      
      // Update the complete dataset
      setAllListings(prev => JSON.stringify(prev) !== JSON.stringify(newAllListings) ? newAllListings : prev);
      setAllMyListings(prev => JSON.stringify(prev) !== JSON.stringify(newAllMyListings) ? newAllMyListings : prev);
      
      // Cache the complete data
      cacheData(newAllListings, newAllMyListings, currentParams);
      
      setLastFetchParams(currentParams);
      setIsInitialized(true);
    } catch (err) {
      console.error('Error force refreshing data:', err);
      setError('Failed to refresh data');
      setAllListings([]);
      setAllMyListings([]);
    } finally {
      setLoading(false);
    }
  }, [searchTerm, sortBy, getSortParams, transformListing, cacheData]);

  // Home/Logo refresh - resets filters and forces fresh data
  const refreshHome = useCallback(async () => {
    console.log('🏠 Home refresh - resetting all filters and fetching fresh data');
    
    // Reset all filters
    setActiveCategory('all');
    setSearchTerm('');
    setSortBy('newest');
    
    // Clear cache to force fresh data
    sessionStorage.removeItem('polymart_dashboard_data');
    
    // Force refresh with clean state
    setLoading(true);
    setError(null);
    setIsInitialized(false);
    
    try {
      const publicParams = {
        // Fetch ALL data with no filters
        ...getSortParams('newest')
      };
      
      const [publicResponse, myResponse] = await Promise.all([
        ListingService.getPublicListings(publicParams),
        ListingService.getMyListings({
          sort_by: 'newest'
        })
      ]);
      
      // Transform and store ALL listings
      let newAllListings = [];
      if (publicResponse.products) {
        newAllListings = publicResponse.products.map(transformListing);
      }
      
      let newAllMyListings = [];
      if (myResponse.products) {
        newAllMyListings = myResponse.products.map(transformListing);
      }
      
      // Update datasets
      setAllListings(newAllListings);
      setAllMyListings(newAllMyListings);
      
      // Cache fresh data
      cacheData(newAllListings, newAllMyListings, { searchTerm: '' });
      
      setLastFetchParams({ searchTerm: '' });
      setIsInitialized(true);
      
      console.log('🏠 Home refresh completed');
    } catch (err) {
      console.error('Error refreshing home:', err);
      setError('Failed to refresh data');
      setAllListings([]);
      setAllMyListings([]);
    } finally {
      setLoading(false);
    }
  }, [getSortParams, transformListing, cacheData]);

      // Initial data load and search term changes (category changes are handled client-side)
  useEffect(() => {
    refreshData();
  }, [refreshData]);

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
    clearCache: () => sessionStorage.removeItem('polymart_dashboard_data'),
    hasData: filteredListings.length > 0 || filteredMyListings.length > 0
  };
};

export default useDashboardData;
