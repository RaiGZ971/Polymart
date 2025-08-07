import { create } from 'zustand';

export const useDashboardStore = create((set) => ({
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
}));
