import { create } from 'zustand'
import { formattedNotifications } from '../utils/formattedNotifications.js';
import { NotificationService } from '../services/index.js'

export const useNotificationStore = create((set) => ({
    notifications: [],
    fetchNotifications: async (userID) => {
        try{
            const res = await NotificationService.getUserNotification(userID);
            const formattedRes = await formattedNotifications(res); 
            set({ notifications: formattedRes });
        }catch(error){
            console.error("Failed to fetch notifications: ", error)
        }
    }
}))