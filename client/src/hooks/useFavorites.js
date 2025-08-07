import { useState, useCallback } from 'react';
import { FavoritesService } from '../services';

export const useFavorites = () => {
  const [favorites, setFavorites] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const fetchFavorites = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      
      const response = await FavoritesService.getFavoriteListings(true);
      
      if (response.success || response.favorites) {
        const favoritesData = response.favorites || response.data?.favorites || [];
        setFavorites(favoritesData);
        return favoritesData;
      } else {
        throw new Error(response.message || 'Failed to fetch favorites');
      }
    } catch (err) {
      console.error('Error fetching favorites:', err);
      setError(err.message || 'Failed to load favorites');
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  const toggleFavorite = useCallback(async (listingId) => {
    try {
      const response = await FavoritesService.toggleFavorite(listingId);
      
      if (response.success || response.is_favorited !== undefined) {
        const isFavorited = response.is_favorited;
        
        if (isFavorited) {
          // Item was added to favorites - we could refetch or add it locally
          // For now, we'll just refetch to get the complete data
          await fetchFavorites();
        } else {
          // Item was removed from favorites
          setFavorites(prevFavorites => 
            prevFavorites.filter(fav => fav.listing_id !== listingId)
          );
        }
        
        return response;
      } else {
        throw new Error(response.message || 'Failed to toggle favorite');
      }
    } catch (err) {
      console.error('Error toggling favorite:', err);
      throw err;
    }
  }, [fetchFavorites]);

  const checkFavoriteStatus = useCallback(async (listingId) => {
    try {
      const response = await FavoritesService.checkFavoriteStatus(listingId);
      
      if (response.success || response.data) {
        return response.data;
      } else {
        throw new Error(response.message || 'Failed to check favorite status');
      }
    } catch (err) {
      console.error('Error checking favorite status:', err);
      throw err;
    }
  }, []);

  const removeFavorite = useCallback(async (listingId) => {
    try {
      // Check if it's currently favorited
      const statusResponse = await checkFavoriteStatus(listingId);
      
      if (statusResponse.is_favorited) {
        // Toggle to remove it
        return await toggleFavorite(listingId);
      }
      
      return { success: true, is_favorited: false };
    } catch (err) {
      console.error('Error removing favorite:', err);
      throw err;
    }
  }, [checkFavoriteStatus, toggleFavorite]);

  return {
    favorites,
    loading,
    error,
    fetchFavorites,
    toggleFavorite,
    removeFavorite,
    checkFavoriteStatus,
    setFavorites,
    setError
  };
};
