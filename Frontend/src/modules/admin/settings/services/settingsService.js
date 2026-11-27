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

  getPublicPaymentConfig: async () => {
    const response = await apiClient.get(API_ENDPOINTS.SETTINGS.PUBLIC_PAYMENT_CONFIG);
    return response?.data ?? response;
  },

  updatePaymentSettings: async (paymentData) => {
    const response = await apiClient.put(API_ENDPOINTS.SETTINGS.PAYMENTS, paymentData);
    return response?.data ?? response;
  },

  updateOrderRules: async (rulesData) => {
    const response = await apiClient.put(API_ENDPOINTS.SETTINGS.RULES, rulesData);
    return response?.data ?? response;
  }
};

export default settingsService;
