import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export const useContactStore = create(
  persist((set, get) => ({
    contacts: [],

    setContacts: (data) => set({ contacts: data }),
  })),
  {
    name: 'polymart-contact-state',
    partialize: (state) => ({
      contacts: state.contacts,
    }),
  }
);
