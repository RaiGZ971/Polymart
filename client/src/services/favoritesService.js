import { ApiClient } from './apiClient.js';

export class FavoritesService {
  /**
   * Toggle favorite status for a listing
   * @param {number} listingId - The listing ID to toggle favorite status
   * @returns {Promise<Object>} Response with favorite status
   */
  static async toggleFavorite(listingId) {
    try {
      return await ApiClient.post('/supabase/favorite-listings', { listing_id: listingId });
    } catch (error) {
      console.error('Failed to toggle favorite:', error);
      throw error;
    }
  }

  /**
   * Get current user's favorite listings
   * @param {boolean} includeDetails - Whether to include full listing details (default: true)
   * @returns {Promise<Object>} Response with user's favorite listings
   */
  static async getFavoriteListings(includeDetails = true) {
    try {
      const queryParams = new URLSearchParams();
      queryParams.append('include_listing_details', includeDetails);
      
      const endpoint = `/supabase/favorite-listings?${queryParams.toString()}`;
      return await ApiClient.get(endpoint);
    } catch (error) {
      console.error('Failed to fetch favorite listings:', error);
      throw error;
    }
  }

  /**
   * Check if a specific listing is favorited by the current user
   * @param {number} listingId - The listing ID to check
   * @returns {Promise<Object>} Response with favorite status
   */
  static async checkFavoriteStatus(listingId) {
    try {
      return await ApiClient.get(`/supabase/favorite-listings/check/${listingId}`);
    } catch (error) {
      console.error('Failed to check favorite status:', error);
      throw error;
    }
  }
}
