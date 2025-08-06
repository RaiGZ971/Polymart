import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export const useDashboardStore = create(
  persist(
    (set) => ({
      activeTab: 'all-listings',
      activeCategory: 'all',
      sortBy: 'newest',
      searchTerm: '',
      
      setActiveTab: (tab) => {
        set({ activeTab: tab });
      },
      
      setActiveCategory: (category) => {
        set({ activeCategory: category });
      },
      
      setSortBy: (sortBy) => {
        set({ sortBy: sortBy });
      },
      
      setSearchTerm: (searchTerm) => {
        set({ searchTerm: searchTerm });
      },
      
      reset: () => {
        set({ 
          activeTab: 'all-listings',
          activeCategory: 'all',
          sortBy: 'newest',
          searchTerm: ''
        });
      },
    }),
    {
      name: 'polymart-dashboard-state',
      partialize: (state) => ({
        activeTab: state.activeTab,
        activeCategory: state.activeCategory,
        sortBy: state.sortBy,
        searchTerm: state.searchTerm,
      }),
    }
  )
);
