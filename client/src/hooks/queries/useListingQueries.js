import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { ListingService } from '../../services/listingService';

// Query keys
export const listingKeys = {
  all: ['listings'],
  public: (params) => [...listingKeys.all, 'public', params],
  myListings: (params) => [...listingKeys.all, 'my', params],
  detail: (id) => [...listingKeys.all, 'detail', id],
};

// Get public listings with caching and background updates
export const usePublicListings = (params = {}) => {
  return useQuery({
    queryKey: listingKeys.public(params),
    queryFn: () => ListingService.getPublicListings(params),
    staleTime: 30 * 1000, // 30 seconds
    gcTime: 5 * 60 * 1000, // 5 minutes
    retry: 2,
    refetchOnWindowFocus: false,
    enabled: true,
  });
};

// Get user's own listings with caching
export const useMyListings = (params = {}, token) => {
  return useQuery({
    queryKey: listingKeys.myListings({ ...params, token }),
    queryFn: () => ListingService.getMyListings(params, token),
    staleTime: 30 * 1000, // 30 seconds
    gcTime: 5 * 60 * 1000, // 5 minutes
    retry: 2,
    refetchOnWindowFocus: false,
    enabled: !!token, // Only run if token exists
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
      const previousMyListings = queryClient.getQueryData(
        listingKeys.myListings({})
      );

      // Optimistically update to the new value (add to user's listings)
      if (previousMyListings) {
        queryClient.setQueryData(
          listingKeys.myListings({}),
          (old) => ({
            ...old,
            products: [
              {
                ...newListing,
                listing_id: Date.now(), // Temporary ID
                status: 'pending',
              },
              ...(old.products || []),
            ],
          })
        );
      }

      // Return a context object with the snapshotted value
      return { previousPublicListings, previousMyListings };
    },
    onError: (err, newListing, context) => {
      // If the mutation fails, use the context returned from onMutate to roll back
      if (context?.previousPublicListings) {
        queryClient.setQueryData(
          listingKeys.public({}),
          context.previousPublicListings
        );
      }
      if (context?.previousMyListings) {
        queryClient.setQueryData(
          listingKeys.myListings({}),
          context.previousMyListings
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
        queryKey: listingKeys.detail(variables.listingId) 
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
