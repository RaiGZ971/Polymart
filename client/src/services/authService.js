import { ApiClient } from './apiClient.js';
import { API_BASE } from '../config/api.js';

export class AuthService {
  /**
   * Verify verification session token
   * @param {string} sessionToken - The verification session token
   * @returns {Promise<Object>} Response from the API
   */
  static async verifyVerificationSession(sessionToken) {
    try {
      const url = `${API_BASE}/auth/verify-session`;
      const response = await fetch(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ session_token: sessionToken })
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.detail || `HTTP error status: ${response.status}`);
      }

      return await response.json();
    } catch (error) {
      console.error('Verification session check failed:', error);
      throw error;
    }
  }

  /**
   * Send email verification request
   * @param {string} email - The email address to verify
   * @returns {Promise<Object>} Response from the API
   */
  static async sendEmailVerification(email) {
    try {
      // Use request directly to avoid authentication headers
      const url = `${API_BASE}/auth/verify-email/send`;
      const response = await fetch(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ email })
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.detail || `HTTP error status: ${response.status}`);
      }

      return await response.json();
    } catch (error) {
      console.error('Email verification send failed:', error);
      throw error;
    }
  }

  /**
   * Sign up a new user (Step 2-5 of signup flow)
   * @param {Object} userData - The user data for signup
   * @returns {Promise<Object>} Response from the API
   */
  static async signUp(userData) {
    try {
      console.log('Sending signup data:', userData);
      
      // Use direct fetch to avoid authentication headers for signup
      const url = `${API_BASE}/auth/signup`;
      const response = await fetch(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(userData)
      });

      const responseData = await response.json().catch(() => ({}));
      console.log('Signup response:', response.status, responseData);

      if (!response.ok) {
        throw new Error(responseData.detail || responseData.message || `HTTP error status: ${response.status}`);
      }

      return responseData;
    } catch (error) {
      console.error('Sign up failed:', error);
      throw error;
    }
  }

  /**
   * Login user
   * @param {Object} loginData - The login credentials
   * @returns {Promise<Object>} Response from the API
   */
  static async login(loginData) {
    try {
      const response = await ApiClient.post('/auth/login', loginData);
      
      // Store the token if login is successful
      if (response.success && response.data?.access_token) {
        localStorage.setItem('authToken', response.data.access_token);
      }
      
      return response;
    } catch (error) {
      console.error('Login failed:', error);
      throw error;
    }
  }

  /**
   * Logout user and clear all cached data
   */
  static logout() {
    console.log('🚪 AuthService.logout() called');
    
    // Check what's in storage before clearing
    const authToken = localStorage.getItem('authToken');
    const profileCache = sessionStorage.getItem('user_profile_cache');
    
    console.log('📦 Storage before logout:', {
      hasAuthToken: !!authToken,
      hasProfileCache: !!profileCache
    });
    
    // Remove authentication token
    localStorage.removeItem('authToken');
    
    // Clear profile cache (dashboard cache is no longer used)
    sessionStorage.removeItem('user_profile_cache');
    
    // Verify clearing worked
    const authTokenAfter = localStorage.getItem('authToken');
    const profileCacheAfter = sessionStorage.getItem('user_profile_cache');
    
    console.log('🗑️ Storage after logout:', {
      authTokenCleared: !authTokenAfter,
      profileCacheCleared: !profileCacheAfter
    });
    
    console.log('✅ AuthService.logout() completed');
  }

  /**
   * Check if user is authenticated
   * @returns {boolean} True if user has a valid token
   */
  static isAuthenticated() {
    return !!localStorage.getItem('authToken');
  }

  /**
   * Get current user token
   * @returns {string|null} The auth token or null
   */
  static getToken() {
    return localStorage.getItem('authToken');
  }
}
