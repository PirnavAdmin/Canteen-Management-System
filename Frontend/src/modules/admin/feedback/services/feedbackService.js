/**
 * Feedback & Grievance API Service
 * Pure live integration with .NET 8 Web API (Hostinger Cloud MySQL DB).
 * No mock data, no localStorage caching, no simulated fallbacks.
 */

import { apiClient, API_ENDPOINTS } from '../../../../services/api';

export const feedbackService = {
  getAll: async (params = {}) => {
    const response = await apiClient.get(API_ENDPOINTS.FEEDBACK.BASE, params);
    return response?.data ?? response;
  },

  getById: async (id) => {
    const response = await apiClient.get(API_ENDPOINTS.FEEDBACK.BY_ID(id));
    return response?.data ?? response;
  },

  create: async (feedbackData) => {
    const response = await apiClient.post(API_ENDPOINTS.FEEDBACK.BASE, feedbackData);
    return response?.data ?? response;
  },

  resolveTicket: async (id, resolutionData) => {
    const payload = {
      status: resolutionData.status || 'Resolved',
      notes: resolutionData.notes || resolutionData.resolutionNotes || ''
    };
    const response = await apiClient.post(API_ENDPOINTS.FEEDBACK.RESOLVE(id), payload);
    return response?.data ?? response;
  }
};

export default feedbackService;
