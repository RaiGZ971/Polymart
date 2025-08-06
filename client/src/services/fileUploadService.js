import { ApiClient } from './apiClient.js';
import { useAuthStore } from '../store/authStore.js';

export class FileUploadService {
  /**
   * Upload profile photo and update user profile
   * @param {File} file - The profile photo file
   * @returns {Promise<Object>} Response with uploaded file URL
   */
  static async uploadProfilePhoto(file) {
    try {
      const formData = new FormData();
      formData.append('file', file);

      // Use fetch directly for FormData to let browser set Content-Type
      const response = await fetch(`${ApiClient.getBaseURL()}/s3/user-documents/profile-photo`, {
        method: 'PATCH',
        headers: {
          'Authorization': `Bearer ${useAuthStore.getState().token}`
        },
        body: formData
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.detail || `HTTP error status: ${response.status}`);
      }

      return await response.json();
    } catch (error) {
      console.error('Profile photo upload failed:', error);
      throw error;
    }
  }

  /**
   * Upload verification documents
   * @param {Object} documents - Object containing verification document files
   * @param {File} documents.studentIdFront - Front side of student ID
   * @param {File} documents.studentIdBack - Back side of student ID  
   * @param {File} documents.cor - Certificate of Registration file
   * @returns {Promise<Object>} Response with uploaded document URLs
   */
  static async uploadVerificationDocuments(documents) {
    try {
      const formData = new FormData();
      formData.append('student_id_front', documents.studentIdFront);
      formData.append('student_id_back', documents.studentIdBack);
      formData.append('cor_file', documents.cor);

      // Use fetch directly for FormData to let browser set Content-Type
      const response = await fetch(`${ApiClient.getBaseURL()}/s3/user-documents/verification-documents`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${useAuthStore.getState().token}`
        },
        body: formData
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.detail || `HTTP error status: ${response.status}`);
      }

      return await response.json();
    } catch (error) {
      console.error('Verification documents upload failed:', error);
      throw error;
    }
  }

  /**
   * Delete current user's profile photo
   * @returns {Promise<Object>} Response confirming deletion
   */
  static async deleteProfilePhoto() {
    try {
      return await ApiClient.delete('/s3/user-documents/profile-photo');
    } catch (error) {
      console.error('Profile photo deletion failed:', error);
      throw error;
    }
  }
}
