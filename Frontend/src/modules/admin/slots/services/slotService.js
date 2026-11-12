/**
 * Slot Management API Service
 * Pure live integration with .NET 8 Web API (Hostinger Cloud MySQL DB).
 * No mock data, no localStorage caching, no simulated fallbacks.
 */

import { apiClient, API_ENDPOINTS } from '../../../../services/api';

export const slotService = {
  getAll: async (params = {}) => {
    const response = await apiClient.get(API_ENDPOINTS.SLOTS.BASE, params);
    return response?.data ?? response;
  },

  getById: async (id) => {
    const response = await apiClient.get(API_ENDPOINTS.SLOTS.BY_ID(id));
    return response?.data ?? response;
  },

  create: async (data) => {
    const response = await apiClient.post(API_ENDPOINTS.SLOTS.BASE, data);
    return response?.data ?? response;
  },

  updateCapacity: async (id, newMaxCapacity) => {
    const response = await apiClient.patch(API_ENDPOINTS.SLOTS.UPDATE_CAPACITY(id), {
      maxCapacity: Number(newMaxCapacity)
    });
    return response?.data ?? response;
  },

  togglePause: async (id) => {
    const response = await apiClient.patch(API_ENDPOINTS.SLOTS.TOGGLE_STATUS(id));
    return response?.data ?? response;
  },

  deleteSlot: async (id) => {
    const response = await apiClient.delete(API_ENDPOINTS.SLOTS.BY_ID(id));
    return response?.data ?? response;
  }
};

export default slotService;
