/**
 * Order Management API Service
 * Pure live integration with .NET 8 Web API (Hostinger Cloud MySQL DB).
 * No mock data, no localStorage caching, no simulated fallbacks.
 */

import { apiClient, API_ENDPOINTS } from '../../../../services/api';

export const orderService = {
  getAll: async (params = {}) => {
    const response = await apiClient.get(API_ENDPOINTS.ORDERS.BASE, params);
    return response?.data ?? response;
  },

  getById: async (id) => {
    const response = await apiClient.get(API_ENDPOINTS.ORDERS.BY_ID(id));
    return response?.data ?? response;
  },

  create: async (data) => {
    const response = await apiClient.post(API_ENDPOINTS.ORDERS.BASE, data);
    return response?.data ?? response;
  },

  updateStatus: async (id, newStatus, note = '') => {
    const response = await apiClient.patch(API_ENDPOINTS.ORDERS.UPDATE_STATUS(id), {
      status: newStatus,
      note: note || undefined
    });
    return response?.data ?? response;
  },

  cancelOrder: async (id, reason) => {
    if (!reason || !reason.trim()) {
      throw new Error('A cancellation reason is required.');
    }
    const response = await apiClient.post(API_ENDPOINTS.ORDERS.CANCEL(id), { reason });
    return response?.data ?? response;
  },

  processRefund: async (id) => {
    const response = await apiClient.post(API_ENDPOINTS.ORDERS.REFUND(id));
    return response?.data ?? response;
  }
};

export default orderService;
