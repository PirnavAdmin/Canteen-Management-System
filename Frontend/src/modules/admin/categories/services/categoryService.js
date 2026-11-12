/**
 * Food Categories API Service
 * Pure live integration with .NET 8 Web API (Hostinger Cloud MySQL DB).
 * No mock data, no localStorage caching, no simulated fallbacks.
 */

import { apiClient, API_ENDPOINTS } from '../../../../services/api';

export const categoryService = {
  getAll: async () => {
    const response = await apiClient.get(API_ENDPOINTS.CATEGORIES.BASE);
    return response?.data ?? response;
  },

  getById: async (id) => {
    const response = await apiClient.get(API_ENDPOINTS.CATEGORIES.BY_ID(id));
    return response?.data ?? response;
  },

  create: async (data) => {
    const payload = {
      name: data.name,
      description: data.description,
      displayOrder: Number(data.displayOrder) || 1,
      status: data.status || 'Active'
    };
    const response = await apiClient.post(API_ENDPOINTS.CATEGORIES.BASE, payload);
    return response?.data ?? response;
  },

  update: async (id, data) => {
    const payload = {
      name: data.name,
      description: data.description,
      displayOrder: Number(data.displayOrder) || 1,
      status: data.status || 'Active'
    };
    const response = await apiClient.put(API_ENDPOINTS.CATEGORIES.BY_ID(id), payload);
    return response?.data ?? response;
  },

  toggleStatus: async (id) => {
    const response = await apiClient.patch(API_ENDPOINTS.CATEGORIES.TOGGLE_STATUS(id));
    return response?.data ?? response;
  },

  deleteCategory: async (id) => {
    try {
      const response = await apiClient.delete(API_ENDPOINTS.CATEGORIES.BY_ID(id));
      return { success: true, blockedByPolicy: false, data: response?.data ?? response };
    } catch (err) {
      if (err.status === 409 || err.raw?.response?.status === 409) {
        return {
          success: false,
          blockedByPolicy: true,
          reason: err.message || 'Institutional Policy Violation (SRS §3.2): Category cannot be deleted because dependent items or orders exist.'
        };
      }
      throw err;
    }
  }
};

export default categoryService;
