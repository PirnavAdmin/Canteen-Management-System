/**
 * Settings & Privacy API Service
 * Pure live integration with .NET 8 Web API (Hostinger Cloud MySQL DB).
 * No mock data, no localStorage caching, no simulated fallbacks.
 */

import { apiClient, API_ENDPOINTS } from '../../../../services/api';

export const settingsService = {
  getSettings: async () => {
    const response = await apiClient.get(API_ENDPOINTS.SETTINGS.BASE);
    return response?.data ?? response;
  },

  updateOutletSettings: async (outletData) => {
    const response = await apiClient.put(API_ENDPOINTS.SETTINGS.OUTLET, outletData);
    return response?.data ?? response;
  },

  updatePaymentSettings: async (paymentData) => {
    const response = await apiClient.put(API_ENDPOINTS.SETTINGS.PAYMENTS, paymentData);
    return response?.data ?? response;
  },

  updateOrderRules: async (rulesData) => {
    const response = await apiClient.put(API_ENDPOINTS.SETTINGS.RULES, rulesData);
    return response?.data ?? response;
  },

  updatePrivacySettings: async (privacyData) => {
    const response = await apiClient.put(API_ENDPOINTS.SETTINGS.PRIVACY, privacyData);
    return response?.data ?? response;
  },

  updateDsarStatus: async (requestId, status, notes = '') => {
    const response = await apiClient.patch(API_ENDPOINTS.SETTINGS.UPDATE_REQUEST_STATUS(requestId), {
      status,
      notes
    });
    return response?.data ?? response;
  }
};

export default settingsService;
