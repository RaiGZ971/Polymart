import { ApiClient } from './apiClient.js';
import { AuthService } from './authService.js';

export class UserService {
  /**
   * Get current user information from token
   * @returns {Object|null} Current user data or null if not authenticated
   */
  static getCurrentUser(token) {
    try {
      // JWT tokens have 3 parts separated by dots
      const payload = token.split('.')[1];
      if (!payload) return null;

      // Decode base64 payload
      const decodedPayload = atob(payload);
      const userData = JSON.parse(decodedPayload);

      // Return the user data from the token
      return {
        user_id: userData.user_id,
        username: userData.username,
        email: userData.email,
        student_number: userData.student_number,
        is_verified_student: userData.is_verified_student || false,
      };
    } catch (error) {
      console.error('Failed to decode user token:', error);
      return null;
    }
  }

  /**
   * Get user profile by ID
   * @param {number} userId - The user ID
   * @returns {Promise<Object>} Response with user profile data
   */
  static async getUserProfile(userId) {
    try {
      return await ApiClient.get(`/supabase/users/${userId}`);
    } catch (error) {
      console.error('Failed to fetch user profile:', error);
      throw error;
    }
  }

  /**
   * Get current user's own profile
   * @returns {Promise<Object>} Response with current user's profile data
   */
  static async getMyProfile(token) { 
    try {      
      const currentUser = this.getCurrentUser(token);
      if (!currentUser || !currentUser.user_id) {
        throw new Error('No authenticated user found');
      }

      return await this.getUserProfile(currentUser.user_id);
    } catch (error) {
      console.error('Failed to fetch current user profile:', error);
      throw error;
    }
  }

  /**
   * Check if current user is authenticated
   * @returns {boolean} True if user is authenticated
   */
  static isAuthenticated(token) {
    return (
      token && this.getCurrentUser(token) !== null
    );
  }
}
