/**
 * Media Storage API Service
 * Handles uploading binary media assets (menu photos, outlet images) to the backend.
 * Returns relative filepath stored in the database.
 */

import { apiClient } from './apiClient';
import { API_ENDPOINTS } from './apiEndpoints';

export const mediaService = {
  /**
   * Upload an image file to backend physical storage
   * @param {File|Blob} file The image file selected by user
   * @param {string} folder Target folder ('menu', 'outlets', etc.)
   * @returns {Promise<{ fileUrl: string, fileName: string, fileSizeBytes: number }>}
   */
  uploadImage: async (file, folder = 'menu') => {
    const formData = new FormData();
    formData.append('file', file);
    formData.append('folder', folder);

    const response = await apiClient.post(API_ENDPOINTS.MEDIA.UPLOAD, formData, {
      headers: {
        'Content-Type': 'multipart/form-data'
      }
    });

    return response?.data ?? response;
  }
};

export default mediaService;

