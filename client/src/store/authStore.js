import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export const useAuthStore = create(
  persist((set, get) => ({
    currentUser: null,
    isAuthenticated: false,

    setUser: (user) => set({ currentUser: user, isAuthenticated: true }),
    logout: () => ({
      currentUser: null,
      isAuthenticated: false,
      currentChatID: null,
    }),
  })),
  {
    name: 'polymart-user-stete',
    partialize: (state) => ({
      currentUser: state.currentUser,
      isAuthenticated: state.isAuthenticated,
    }),
  }
);
