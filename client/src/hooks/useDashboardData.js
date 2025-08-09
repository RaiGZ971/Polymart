import { useCallback, useMemo } from 'react';
import { usePublicListings, useMyListings } from './queries/useListingQueries';
import { useAuthStore } from '../store/authStore.js';
import { useDashboardStore } from '../store/dashboardStore.js';

export const useDashboardData = () => {
  // Get current user for user change detection
  const { token } = useAuthStore();
  const {
    activeCategory,
    setActiveCategory,
    sortBy,
    setSortBy,
    searchTerm,
    setSearchTerm,
  } = useDashboardStore();

  // Build query parameters based on current state
  const publicParams = useMemo(
    () => ({
      ...(searchTerm ? { search: searchTerm } : {}),
      sort_by: sortBy,
    }),
    [searchTerm, sortBy]
  );

  const myParams = useMemo(
    () => ({
      ...(searchTerm ? { search: searchTerm } : {}),
      sort_by: sortBy,
    }),
    [searchTerm, sortBy]
  );

  // Use TanStack Query hooks
  const {
    data: allListings = [],
    isLoading: publicLoading,
    isError: publicError,
    error: publicErrorDetails,
    refetch: refetchPublic,
    isFetching: publicFetching,
  } = usePublicListings(publicParams);

  const {
    data: allMyListings = [],
    isLoading: myLoading,
    isError: myError,
    error: myErrorDetails,
    refetch: refetchMy,
    isFetching: myFetching,
  } = useMyListings(myParams, token);

  // Transform API listing data to match ProductCard component expectations
  const transformListing = useCallback((listing) => {
    const hasRange =
      listing.price_min !== null &&
      listing.price_max !== null &&
      listing.price_min !== listing.price_max;

    return {
      // Original API data for reference
      ...listing,

      // Transformed data for ProductCard component
      id: listing.listing_id,
      listingId: listing.listing_id, // Add this for FavoriteButton
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
      availableSchedules: listing.available_schedules || [],
      paymentMethods: listing.payment_methods || [],
      meetupLocations: listing.seller_meetup_locations || [],
      transactionMethods: listing.transaction_methods || [],
    };
  }, []);

  // Transform server data to client format
  const allListings = useMemo(() => {
    const products = publicResponse.products || [];
    return products.map(transformListing);
  }, [publicResponse, transformListing]);

  const allMyListings = useMemo(() => {
    const products = myResponse.products || [];
    return products.map(transformListing);
  }, [myResponse, transformListing]);

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
