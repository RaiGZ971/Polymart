import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export const useAuthStore = create(
  persist(
    (set, get) => ({
      userID: null,
      token: null,
      isAuthenticated: false,
      username: '', // User's login username
      firstName: '', // User's first name for display
      
      // Store parsed user data to avoid JWT parsing on every call
      currentUser: null,

      setUser: (userID, token) => {
        // Parse the JWT token once and store the user data
        const userData = parseJWT(token);
        
        set({
          token: token,
          userID: userID,
          isAuthenticated: true,
          currentUser: userData,
        });
      },

      setUserProfile: (profileData) => {
        set({ 
          username: profileData?.username || '',
          firstName: profileData?.first_name || '',
        });
      },

      getCurrentUser: () => {
        const state = get();
        return state.currentUser;
      },

      getDisplayName: () => {
        const state = get();
        return state.firstName || state.username || 'User';
      },

      logout: () => {
        set({
          userID: null,
          token: null,
          isAuthenticated: false,
          username: '',
          firstName: '',
          currentUser: null,
        });
      },
    }),
    {
      name: 'polymart-user-state',
      partialize: (state) => ({
        userID: state.userID,
        token: state.token,
        isAuthenticated: state.isAuthenticated,
        username: state.username,
        firstName: state.firstName,
        currentUser: state.currentUser,
      }),
    }
  )
);

// Helper function to parse JWT token (moved from UserService)
function parseJWT(token) {
  try {
    if (!token) return null;
    
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
