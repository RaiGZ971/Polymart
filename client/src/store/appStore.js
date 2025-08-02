import { Sidebar, SidebarOpen } from 'lucide-react';
import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export const useAppStore = create(
  persist((set, get) => ({
    //UI State
    theme: 'light',

    //User State
    currentUser: null,
    isAuthenticated: false,

    //Actions
    setTheme: (theme) => set({ theme }),

    //Auth actions
    setUser: (user) => set({ currentUser: user, isAuthenticated: true }),
    logout: () => ({
      currentUser: null,
      isAuthenticated: false,
      currentChatID: null,
    }),
  })),
  {
    name: 'polymart-app-state',
    partialize: (state) => ({
      theme: state.theme,
    }),
  }
);
