import { ApiClient } from './apiClient.js';

export class ListingService {
  /**
   * Get all public listings (excluding user's own listings)
   * @param {Object} params - Query parameters
   * @param {number} params.page - Page number (default: 1)
   * @param {number} params.page_size - Items per page (default: 20)
   * @param {string} params.category - Filter by category
   * @param {string} params.search - Search term
   * @param {number} params.min_price - Minimum price filter
   * @param {number} params.max_price - Maximum price filter
   * @returns {Promise<Object>} Response with listings data
   */
  static async getPublicListings(params = {}) {
    try {
      const queryParams = new URLSearchParams();
      
      // Add parameters if they exist
      if (params.page) queryParams.append('page', params.page);
      if (params.page_size) queryParams.append('page_size', params.page_size);
      if (params.category && params.category !== 'all') queryParams.append('category', params.category);
      if (params.search) queryParams.append('search', params.search);
      if (params.min_price !== undefined) queryParams.append('min_price', params.min_price);
      if (params.max_price !== undefined && params.max_price !== Infinity) queryParams.append('max_price', params.max_price);
      
      const endpoint = `/supabase/listings${queryParams.toString() ? '?' + queryParams.toString() : ''}`;
      return await ApiClient.get(endpoint);
    } catch (error) {
      console.error('Failed to fetch public listings:', error);
      throw error;
    }
  }

  /**
   * Get current user's own listings
   * @param {Object} params - Query parameters
   * @param {string} params.category - Filter by category
   * @param {string} params.search - Search term
   * @param {string} params.status - Filter by status (active, inactive, sold_out, archived)
   * @returns {Promise<Object>} Response with user's listings data
   */
  static async getMyListings(params = {}) {
    try {
      const queryParams = new URLSearchParams();
      
      // Add parameters if they exist
      if (params.category && params.category !== 'all') queryParams.append('category', params.category);
      if (params.search) queryParams.append('search', params.search);
      if (params.status) queryParams.append('status', params.status);
      
      const endpoint = `/supabase/listings/my-listings${queryParams.toString() ? '?' + queryParams.toString() : ''}`;
      return await ApiClient.get(endpoint);
    } catch (error) {
      console.error('Failed to fetch user listings:', error);
      throw error;
    }
  }

  /**
   * Get a specific listing by ID
   * @param {number} listingId - The listing ID
   * @returns {Promise<Object>} Response with listing details
   */
  static async getListingById(listingId) {
    try {
      return await ApiClient.get(`/supabase/listings/${listingId}`);
    } catch (error) {
      console.error('Failed to fetch listing details:', error);
      throw error;
    }
  }

  /**
   * Create a new listing
   * @param {Object} listingData - The listing data to create
   * @returns {Promise<Object>} Response with created listing data
   */
  static async createListing(listingData) {
    try {
      return await ApiClient.post('/supabase/listings', listingData);
    } catch (error) {
      console.error('Failed to create listing:', error);
      throw error;
    }
  }

  /**
   * Update listing status
   * @param {number} listingId - The listing ID
   * @param {string} status - New status (active, inactive, sold_out, archived)
   * @returns {Promise<Object>} Response with updated listing data
   */
  static async updateListingStatus(listingId, status) {
    try {
      return await ApiClient.patch(`/supabase/listings/${listingId}/status`, { status });
    } catch (error) {
      console.error('Failed to update listing status:', error);
      throw error;
    }
  }
}
