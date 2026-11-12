/**
 * Menu API Service
 * Pure live integration with .NET 8 Web API (Hostinger Cloud MySQL DB).
 * No mock data, no localStorage caching, no simulated fallbacks.
 */

import { apiClient, API_ENDPOINTS } from '../../../../services/api';

export const menuService = {
  getAll: async (params = {}) => {
    const response = await apiClient.get(API_ENDPOINTS.MENU.BASE, params);
    return response?.data ?? response;
  },

  getById: async (id) => {
    const response = await apiClient.get(API_ENDPOINTS.MENU.BY_ID(id));
    return response?.data ?? response;
  },

  create: async (data) => {
    const response = await apiClient.post(API_ENDPOINTS.MENU.BASE, data);
    return response?.data ?? response;
  },

  update: async (id, data) => {
    const response = await apiClient.put(API_ENDPOINTS.MENU.BY_ID(id), data);
    return response?.data ?? response;
  },

  toggleStatus: async (id) => {
    const response = await apiClient.patch(API_ENDPOINTS.MENU.TOGGLE_STATUS(id));
    return response?.data ?? response;
  },

  togglePublish: async (id) => {
    const response = await apiClient.patch(API_ENDPOINTS.MENU.TOGGLE_PUBLISH(id));
    return response?.data ?? response;
  },

  deleteItem: async (id) => {
    const response = await apiClient.delete(API_ENDPOINTS.MENU.BY_ID(id));
    return response?.data ?? response;
  }
};

export default menuService;
