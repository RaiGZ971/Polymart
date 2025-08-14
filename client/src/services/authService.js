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
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ session_token: sessionToken }),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(
          errorData.detail || `HTTP error status: ${response.status}`
        );
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
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email }),
      });

      if (!response.ok) {
        // Try to get the detailed error message from the response
        let errorMessage = `HTTP error status: ${response.status}`;
        try {
          const errorData = await response.json();
          if (errorData.detail) {
            errorMessage = errorData.detail;
          } else if (errorData.message) {
            errorMessage = errorData.message;
          }
        } catch (parseError) {
          console.warn('Could not parse error response:', parseError);
        }
        
        throw new Error(errorMessage);
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
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(userData),
      });

      const responseData = await response.json().catch(() => ({}));
      console.log('Signup response:', response.status, responseData);

      if (!response.ok) {
        throw new Error(
          responseData.detail ||
            responseData.message ||
            `HTTP error status: ${response.status}`
        );
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
    if (import.meta.env.DEV) {
      console.log('🚪 AuthService.logout() called');
    }
    
    // Clear profile cache from sessionStorage
    sessionStorage.removeItem('user_profile_cache');
    
    // Clear any legacy localStorage tokens if they exist
    localStorage.removeItem('authToken');
    
    // Force clear all Zustand persisted stores from localStorage
    localStorage.removeItem('polymart-contact-state');
    localStorage.removeItem('polymart-user-state');
    
    // Double-check and clear any remaining polymart-related keys
    const keys = Object.keys(localStorage);
    keys.forEach(key => {
      if (key.startsWith('polymart-')) {
        if (import.meta.env.DEV) {
          console.log(`🗑️ Removing additional key: ${key}`);
        }
        localStorage.removeItem(key);
      }
    });
    
    if (import.meta.env.DEV) {
      console.log('🧹 Cleared cached data and stores on logout');
    }
  }

}
