import { ApiClient } from "./apiClient";

export class NotificationService{
    static async getNotification(userID, notificationID){
        return ApiClient.get(`/dynamodb/notification/${userID}/${notificationID}`);
    }

    static async getUserNotification(userID){
        return ApiClient.get(`/dynamodb/notifications/${userID}`);
    }

    static async uploadNotification(form){
        return ApiClient.post(`/dynamodb/notification`, form);
    }

    static async notificationSeenUpdate(userID){
        return ApiClient.putStatus(`/dynamodb/notification-seen-update/${userID}`);
    }

    static async deleteNotification(userID, notificationID){
        return ApiClient.delete(`/dynamodb/notification/${userID}/${notificationID}`);
    }

    static async deleteReadNotifications(userID){
        return ApiClient.delete(`/dynamodb/notifications/${userID}`);
    }


}