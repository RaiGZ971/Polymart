import { ApiClient } from './apiClient.js';
import { API_BASE } from '../config/api';
import { useAuthStore } from '../store/authStore.js';

export class ChatService {
  static async getContacts(userID) {
    return ApiClient.get(`/dynamodb/contacts/${userID}`);
  }

  static async getMessages(senderID, receiverID) {
    return ApiClient.get(`/dynamodb/messages/${senderID}/${receiverID}`);
  }

  static async uploadMessage(roomID, form) {
    return ApiClient.post(`/dynamodb/message/${roomID}`, form);
  }

  static async updateMessage(roomID, messageID, content) {
    return ApiClient.put(
      `/dynamodb/message-update/${roomID}/${messageID}`,
      content
    );
  }

  static async updateReadStatus(senderID, receiverID) {
    return ApiClient.putStatus(
      `/dynamodb/messages-status-updates/${senderID}/${receiverID}`
    );
  }

  static async deleteMessage(roomID, messageID) {
    return ApiClient.delete(`/dynamodb/message-delete/${roomID}/${messageID}`);
  }

  static async deleteMessageFull(roomID, messageID) {
    return ApiClient.delete(
      `/dynamodb/message-delete-full/${roomID}/${messageID}`
    );
  }

  static async uploadImageBucket(roomID, imageFile) {
    const formData = new FormData();
    formData.append('image', imageFile);

    const response = await fetch(`${API_BASE}/s3/message/${roomID}`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${useAuthStore.getState().token}`,
      },
      body: formData,
    });

    if (!response.ok) {
      throw new Error(`Failed to upload image: ${response.statusText}`);
    }

    return response.json();
  }

  static async deleteMessageImageBucket(image) {
    return ApiClient.deleteData(`/s3/message`, image);
  }
}
