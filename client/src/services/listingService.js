import { ApiClient } from './apiClient.js';
import { UserService } from './userService.js';

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
   * @param {string} params.sort_by - Sort by option (newest, date_oldest, name_a_z, name_z_a, price_low_high, price_high_low)
   * @returns {Promise<Object>} Response with listings data
   */
  static async getPublicListings(params = {}) {
    try {
      const queryParams = new URLSearchParams();
      
      // Add parameters if they exist
      if (params.page) queryParams.append('page', params.page);
      if (params.page_size) queryParams.append('page_size', params.page_size);
      
      // Add category filter if provided (skip 'all' as it means no filter)
      if (params.category && params.category !== 'all') {
        queryParams.append('category', params.category);
      }
      
      if (params.search) queryParams.append('search', params.search);
      if (params.min_price !== undefined) queryParams.append('min_price', params.min_price);
      if (params.max_price !== undefined && params.max_price !== Infinity) queryParams.append('max_price', params.max_price);
      if (params.sort_by) queryParams.append('sort_by', params.sort_by);
      
      const endpoint = `/supabase/listings${queryParams.toString() ? '?' + queryParams.toString() : ''}`;
      return await ApiClient.get(endpoint);
    } catch (error) {
      console.error('Failed to fetch public listings:', error);
      throw error;
    }
  }

  /**
   * Get current user's listings
   * @param {Object} params - Query parameters
   * @param {string} token - User authentication token
   * @returns {Promise<Object>} Response with user's listings data
   */
  static async getMyListings(params = {}, token) {
    try {
      const currentUser = UserService.getCurrentUser();
      if (!currentUser || !currentUser.user_id) {
        throw new Error('No authenticated user found');
      }

      return await this.getUserListings(currentUser.user_id, params);
    } catch (error) {
      console.error('Failed to fetch user listings:', error);
      throw error;
    }
  }

  /**
   * Get listings for a specific user by user ID
   * @param {string} userId - The user ID
   * @param {Object} params - Query parameters
   * @param {string} params.category - Filter by category
   * @param {string} params.search - Search term
   * @param {string} params.status - Filter by status (active, inactive, sold_out, archived)
   * @param {string} params.sort_by - Sort by option (newest, date_oldest, name_a_z, name_z_a, price_low_high, price_high_low)
   * @returns {Promise<Object>} Response with user's listings data
   */
  static async getUserListings(userId, params = {}) {
    try {
      const queryParams = new URLSearchParams();
      
      // Add category filter if provided (skip 'all' as it means no filter)
      if (params.category && params.category !== 'all') {
        queryParams.append('category', params.category);
      }
      
      if (params.search) queryParams.append('search', params.search);
      if (params.status) queryParams.append('status', params.status);
      if (params.sort_by) queryParams.append('sort_by', params.sort_by);
      
      const endpoint = `/supabase/listings/user/${userId}${queryParams.toString() ? '?' + queryParams.toString() : ''}`;
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
   * Upload listing images to S3 and associate with listing
   * @param {number} listingId - The listing ID
   * @param {File[]} images - Array of image files to upload
   * @returns {Promise<Object>} Response with uploaded image data
   */
  static async uploadListingImages(listingId, images) {
    try {
      const formData = new FormData();
      images.forEach((image, index) => {
        formData.append('images', image);
      });

      // Use fetch directly for FormData to let browser set Content-Type
      const { API_BASE } = await import('../config/api.js');
      const { useAuthStore } = await import('../store/authStore.js');
      
      const response = await fetch(`${API_BASE}/s3/listing-images/${listingId}`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${useAuthStore.getState().token}`
        },
        body: formData
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.detail || `HTTP error status: ${response.status}`);
      }

      return await response.json();
    } catch (error) {
      console.error('Failed to upload listing images:', error);
      throw error;
    }
  }

  /**
   * Create a complete listing with images
   * @param {Object} transformedListingData - The transformed listing data
   * @param {File[]} images - Array of image files to upload
   * @returns {Promise<Object>} Response with created listing and upload results
   */
  static async createListingWithImages(transformedListingData, images) {
    try {
      // First create the listing
      const listingResponse = await this.createListing(transformedListingData);
      
      if (!listingResponse.success || !listingResponse.data?.listing_id) {
        throw new Error('Failed to create listing: ' + (listingResponse.message || 'Unknown error'));
      }
      
      const listingId = listingResponse.data.listing_id;
      let imageUploadResult = null;
      
      // Then upload images if provided
      if (images && images.length > 0) {
        try {
          imageUploadResult = await this.uploadListingImages(listingId, images);
        } catch (imageError) {
          console.error('Failed to upload images for listing:', imageError);
          // Log the error but don't fail the entire operation
          // The listing was created successfully, just image upload failed
          imageUploadResult = {
            success: false,
            error: imageError.message
          };
        }
      }
      
      return {
        success: true,
        message: 'Listing created successfully',
        data: {
          listing: listingResponse.data,
          images: imageUploadResult
        }
      };
      
    } catch (error) {
      console.error('Failed to create listing with images:', error);
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

  /**
   * Get single listing by ID
   * @param {number} listingId - The listing ID
   * @returns {Promise<Object>} Response with listing data
   */
  static async getListingById(listingId) {
    try {
      return await ApiClient.get(`/supabase/listings/${listingId}`);
    } catch (error) {
      console.error('Failed to fetch listing:', error);
      throw error;
    }
  }

  /**
   * Update listing data (using PATCH for partial updates)
   * @param {number} listingId - The listing ID
   * @param {Object} data - Updated listing data (partial update)
   * @returns {Promise<Object>} Response with updated listing data
   */
  static async updateListing(listingId, data) {
    try {
      return await ApiClient.patch(`/supabase/listings/${listingId}`, data);
    } catch (error) {
      console.error('Failed to update listing:', error);
      throw error;
    }
  }

  /**
   * Delete listing
   * @param {number} listingId - The listing ID
   * @returns {Promise<Object>} Response with deletion confirmation
   */
  static async deleteListing(listingId) {
    try {
      return await ApiClient.delete(`/supabase/listings/${listingId}`);
    } catch (error) {
      console.error('Failed to delete listing:', error);
      throw error;
    }
  }
}
