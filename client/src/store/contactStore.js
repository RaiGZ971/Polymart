import { create } from "zustand";
import { ChatService } from "../services/index.js";

export const useContactStore = create((set) => ({
    contacts: [],
    fetchContacts: async (userID) => {
        try{
            const res = await ChatService.getContacts(userID);
            set({ contacts: res });
        }catch (error){
            console.error('Failed to fetch contacts: ', error);
        }
    }
}))