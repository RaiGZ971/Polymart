import { ApiClient } from './apiClient.js';

export class OrderService {
  /**
   * Get user's orders (both as buyer and seller)
   * @param {Object} params - Query parameters
   * @param {number} params.page - Page number (default: 1)
   * @param {number} params.page_size - Items per page (default: 20)
   * @param {string} params.status - Filter by order status
   * @param {boolean} params.as_buyer - Get orders as buyer (true) or seller (false)
   * @returns {Promise<Object>} Response with orders data
   */
  static async getUserOrders(params = {}) {
    try {
      const queryParams = new URLSearchParams();
      
      // Add parameters if they exist
      if (params.page) queryParams.append('page', params.page);
      if (params.page_size) queryParams.append('page_size', params.page_size);
      if (params.status) queryParams.append('status', params.status);
      if (params.as_buyer !== undefined) queryParams.append('as_buyer', params.as_buyer);
      
      const endpoint = `/supabase/orders${queryParams.toString() ? '?' + queryParams.toString() : ''}`;
      return await ApiClient.get(endpoint);
    } catch (error) {
      console.error('Failed to fetch user orders:', error);
      throw error;
    }
  }

  /**
   * Get details of a specific order
   * @param {number} orderId - The order ID
   * @returns {Promise<Object>} Response with order details
   */
  static async getOrderById(orderId) {
    try {
      return await ApiClient.get(`/supabase/orders/${orderId}`);
    } catch (error) {
      console.error('Failed to fetch order details:', error);
      throw error;
    }
  }

  /**
   * Create a new order
   * @param {Object} orderData - The order data to create
   * @returns {Promise<Object>} Response with created order data
   */
  static async createOrder(orderData) {
    try {
      return await ApiClient.post('/supabase/orders', orderData);
    } catch (error) {
      console.error('Failed to create order:', error);
      throw error;
    }
  }

  /**
   * Update meetup details for an order
   * @param {number} orderId - The order ID
   * @param {Object} meetupData - The meetup data to update
   * @param {string} userRole - 'buyer' or 'seller' to determine proposed_by
   * @returns {Promise<Object>} Response with updated meetup data
   */
  static async updateMeetup(orderId, meetupData, userRole = 'buyer') {
    try {
      // Add proposed_by field when updating scheduled_at (rescheduling)
      if (meetupData.scheduled_at && userRole) {
        meetupData.proposed_by = userRole;
      }
      
      return await ApiClient.patch(`/supabase/orders/${orderId}/meetup`, meetupData);
    } catch (error) {
      console.error('Failed to update meetup:', error);
      throw error;
    }
  }

  /**
   * Create a meetup for an order
   * @param {number} orderId - The order ID
   * @param {Object} meetupData - The meetup data to create
   * @returns {Promise<Object>} Response with created meetup data
   */
  static async createMeetup(orderId, meetupData) {
    try {
      return await ApiClient.post(`/supabase/orders/${orderId}/meetup`, meetupData);
    } catch (error) {
      console.error('Failed to create meetup:', error);
      throw error;
    }
  }

  /**
   * Confirm meetup by buyer or seller
   * @param {number} orderId - The order ID
   * @returns {Promise<Object>} Response with confirmed meetup data
   */
  static async confirmMeetup(orderId) {
    try {
      return await ApiClient.patch(`/supabase/orders/${orderId}/meetup/confirm`);
    } catch (error) {
      console.error('Failed to confirm meetup:', error);
      throw error;
    }
  }

  /**
   * Check if user has a pending order for a specific listing
   * @param {number} listingId - The listing ID to check
   * @returns {Promise<Object>} Response with pending order status
   */
  static async checkPendingOrder(listingId) {
    try {
      return await ApiClient.get(`/supabase/orders/check-pending/${listingId}`);
    } catch (error) {
      console.error('Failed to check pending orders:', error);
      throw error;
    }
  }

  /**
   * Update order status
   * @param {number} orderId - The order ID
   * @param {string} status - The new status ('pending', 'confirmed', 'completed', 'cancelled')
   * @returns {Promise<Object>} Response with updated order data
   */
  static async updateOrderStatus(orderId, status) {
    try {
      return await ApiClient.patch(`/supabase/orders/${orderId}/status`, { status });
    } catch (error) {
      console.error('Failed to update order status:', error);
      throw error;
    }
  }
}
