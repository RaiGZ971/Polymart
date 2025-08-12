import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { ListingService } from '../../services/listingService';
import { formattedListing } from '../../utils/formattedListing';
import { UserService } from '../../services/userService';

// Query keys
export const listingKeys = {
  all: ['listings'],
  public: (params) => [...listingKeys.all, 'public', params],
  myListings: (params, userID) => [...listingKeys.all, 'my', userID, params],
  detail: (id) => [...listingKeys.all, 'detail', id],
};

// Get public listings with caching and background updates
export const usePublicListings = (params = {}, enabled = true) => {
  return useQuery({
    queryKey: listingKeys.public(params),
    queryFn: () => ListingService.getPublicListings(params),
    staleTime: 5 * 60 * 1000, // 5 minutes - prevent refetching when navigating back quickly
    gcTime: 10 * 60 * 1000, // 10 minutes
    retry: 2,
    refetchOnWindowFocus: false,
    enabled: enabled, // Now controllable from parent
    select: (listings) => {
      return listings.products.map((listing) => formattedListing(listing));
    },
  });
};

// Get user's own listings with caching
export const useMyListings = (params = {}, token) => {
  // Get user ID from auth store - no more JWT parsing!
  const currentUser = UserService.getCurrentUser();
  const userID = currentUser?.user_id;

  return useQuery({
    queryKey: listingKeys.myListings(params, userID), // Include userID in query key
    queryFn: () => ListingService.getMyListings(params, token),
    staleTime: 5 * 60 * 1000, // 5 minutes - prevent refetching when navigating back quickly
    gcTime: 10 * 60 * 1000, // 10 minutes
    retry: 2,
    refetchOnWindowFocus: false,
    enabled: !!token && !!userID, // Only run if token and userID exist
    select: (listings) => {
      return listings.products.map((listing) => formattedListing(listing));
    },
  });
};

// Get single listing details
export const useListing = (listingId) => {
  return useQuery({
    queryKey: listingKeys.detail(listingId),
    queryFn: () => ListingService.getListingById(listingId),
    staleTime: 60 * 1000, // 1 minute
    enabled: !!listingId,
  });
};

// Mutation hooks for CRUD operations with optimistic updates
export const useCreateListing = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (listingData) => ListingService.createListing(listingData),
    onMutate: async (newListing) => {
      // Cancel any outgoing refetches (so they don't overwrite our optimistic update)
      await queryClient.cancelQueries({ queryKey: listingKeys.all });

      // Snapshot the previous value
      const previousPublicListings = queryClient.getQueryData(
        listingKeys.public({})
      );
      // Note: Skip optimistic updates for myListings since userID is dynamic
      // We'll rely on the onSettled invalidation to refresh the data

      // Return a context object with the snapshotted value
      return { previousPublicListings };
    },
    onError: (err, newListing, context) => {
      // If the mutation fails, use the context returned from onMutate to roll back
      if (context?.previousPublicListings) {
        queryClient.setQueryData(
          listingKeys.public({}),
          context.previousPublicListings
        );
      }
      console.error('Failed to create listing:', err);
    },
    onSettled: () => {
      // Always refetch after error or success to ensure we have latest data
      queryClient.invalidateQueries({ queryKey: listingKeys.all });
    },
  });
};

export const useUpdateListing = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ listingId, data }) =>
      ListingService.updateListing(listingId, data),
    onSuccess: (data, variables) => {
      // Invalidate specific listing and all listings
      queryClient.invalidateQueries({
        queryKey: listingKeys.detail(variables.listingId),
      });
      queryClient.invalidateQueries({ queryKey: listingKeys.all });
    },
    onError: (error) => {
      console.error('Failed to update listing:', error);
    },
  });
};

export const useDeleteListing = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (listingId) => ListingService.deleteListing(listingId),
    onSuccess: () => {
      // Invalidate all listings queries
      queryClient.invalidateQueries({ queryKey: listingKeys.all });
    },
    onError: (error) => {
      console.error('Failed to delete listing:', error);
    },
  });
};
