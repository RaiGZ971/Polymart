import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export const useAuthStore = create(
  persist(
    (set, get) => ({
      userID: null,
      token: null,
      isAuthenticated: false,
      data: {},

      setUser: (userID, token) => {
        set({
          token: token,
          userID: userID,
          isAuthenticated: true,
        });
      },

      setData: (data) => {
        set({ data: data });
      },

      logout: () => {
        set({
          userID: null,
          token: null,
          isAuthenticated: false,
          data: [],
        });
      },
    }),
    {
      name: 'polymart-user-state',
      partialize: (state) => ({
        userID: state.userID,
        token: state.token,
        isAuthenticated: state.isAuthenticated,
        data: state.data,
      }),
    }
  )
);
