import { ApiClient } from './apiClient.js';
import { AuthService } from './authService.js';
import { useAuthStore } from '../store/authStore.js';

export class UserService {
  /**
   * Get current user information from auth store (optimized - no JWT parsing)
   * @returns {Object|null} Current user data or null if not authenticated
   */
  static getCurrentUser() {
    try {
      return useAuthStore.getState().getCurrentUser();
    } catch (error) {
      console.error('Failed to get current user:', error);
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
  static async getMyProfile() { 
    try {      
      const currentUser = this.getCurrentUser();
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
  static isAuthenticated() {
    const authState = useAuthStore.getState();
    return authState.isAuthenticated && authState.currentUser !== null;
  }
}
