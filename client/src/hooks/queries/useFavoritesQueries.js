import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { FavoritesService } from '../../services/favoritesService';

// Query keys
export const favoritesKeys = {
  all: ['favorites'],
  lists: () => [...favoritesKeys.all, 'list'],
  status: (listingId) => [...favoritesKeys.all, 'status', listingId],
  batch: (listingIds) => [...favoritesKeys.all, 'batch', listingIds],
};

// Get all user's favorite listings
export const useFavoriteListings = () => {
  return useQuery({
    queryKey: favoritesKeys.lists(),
    queryFn: () => FavoritesService.getFavoriteListings(true),
    staleTime: 60 * 1000, // 1 minute
    select: (data) => data.favorites || data.data?.favorites || [],
  });
};

// Check single favorite status
export const useFavoriteStatus = (listingId) => {
  return useQuery({
    queryKey: favoritesKeys.status(listingId),
    queryFn: () => FavoritesService.checkFavoriteStatus(listingId),
    enabled: !!listingId,
    staleTime: 2 * 60 * 1000, // 2 minutes - reduce favorite status refetching
    select: (data) => data.data?.is_favorited || false,
  });
};

// Bulk check favorite status for multiple listings
export const useBatchFavoriteStatus = (listingIds = []) => {
  return useQuery({
    queryKey: favoritesKeys.batch(listingIds),
    queryFn: async () => {
      if (!listingIds.length) return {};
      
      // Make parallel requests for all listings
      const promises = listingIds.map(async (listingId) => {
        try {
          const response = await FavoritesService.checkFavoriteStatus(listingId);
          return { listingId, isFavorited: response.data?.is_favorited || false };
        } catch (error) {
          console.error(`Error checking favorite status for listing ${listingId}:`, error);
          return { listingId, isFavorited: false };
        }
      });
      
      const results = await Promise.all(promises);
      
      // Convert to object for easy lookup
      return results.reduce((acc, { listingId, isFavorited }) => {
        acc[listingId] = isFavorited;
        return acc;
      }, {});
    },
    enabled: listingIds.length > 0,
    staleTime: 2 * 60 * 1000, // 2 minutes - reduce batch favorite checking
  });
};

// Toggle favorite mutation
export const useToggleFavorite = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (listingId) => FavoritesService.toggleFavorite(listingId),
    onMutate: async (listingId) => {
      // Cancel any outgoing refetches
      await queryClient.cancelQueries({ queryKey: favoritesKeys.status(listingId) });
      
      // Snapshot the previous value
      const previousStatus = queryClient.getQueryData(favoritesKeys.status(listingId));
      
      // Optimistically update the status
      queryClient.setQueryData(favoritesKeys.status(listingId), !previousStatus);
      
      // Also update batch queries if they exist
      const batchQueries = queryClient.getQueriesData({ queryKey: favoritesKeys.all });
      batchQueries.forEach(([queryKey, data]) => {
        if (queryKey[1] === 'batch' && data && typeof data === 'object') {
          queryClient.setQueryData(queryKey, {
            ...data,
            [listingId]: !data[listingId]
          });
        }
      });
      
      return { previousStatus };
    },
    onError: (err, listingId, context) => {
      // If the mutation fails, use the context to roll back
      queryClient.setQueryData(favoritesKeys.status(listingId), context.previousStatus);
      console.error('Failed to toggle favorite:', err);
    },
    onSuccess: (data, listingId) => {
      // Update the status with the server response
      const newStatus = data.is_favorited;
      queryClient.setQueryData(favoritesKeys.status(listingId), newStatus);
      
      // Update batch queries
      const batchQueries = queryClient.getQueriesData({ queryKey: favoritesKeys.all });
      batchQueries.forEach(([queryKey, queryData]) => {
        if (queryKey[1] === 'batch' && queryData && typeof queryData === 'object') {
          queryClient.setQueryData(queryKey, {
            ...queryData,
            [listingId]: newStatus
          });
        }
      });
      
      // Invalidate favorites list if item was added/removed
      queryClient.invalidateQueries({ queryKey: favoritesKeys.lists() });
    },
  });
};
