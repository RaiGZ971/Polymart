import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export const useAuthStore = create(
  persist(
    (set, get) => ({
      currentUser: null,
      token: null,
      isAuthenticated: false,
      data: {},

      setUser: (user, token) => {
        set({
          token: token,
          currentUser: user,
          isAuthenticated: true,
        });
      },

      setData: (data) => {
        set({ data: data });
      },

      logout: () => {
        set({
          currentUser: null,
          token: null,
          isAuthenticated: false,
        });
      },
    }),
    {
      name: 'polymart-user-state',
      partialize: (state) => ({
        currentUser: state.currentUser,
        token: state.token,
        isAuthenticated: state.isAuthenticated,
      }),
    }
  )
);
