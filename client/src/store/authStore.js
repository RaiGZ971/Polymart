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

      setUser: (userID, token) => {
        set({
          token: token,
          userID: userID,
          isAuthenticated: true,
        });
      },

      setUserProfile: (profileData) => {
        set({ 
          username: profileData?.username || '',
          firstName: profileData?.first_name || '',
        });
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
      }),
    }
  )
);
